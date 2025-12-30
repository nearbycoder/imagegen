import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { LogOut, Mountain, Sparkles } from 'lucide-react'
import { PromptSection } from './PromptSection'
import { ModelSelector } from './ModelSelector'
import { AspectRatioSelector } from './AspectRatioSelector'
import { ReferenceImageUpload } from './ReferenceImageUpload'
import { ARTISTIC_STYLES, StyleSelector } from './StyleSelector'
import { GenerateButton } from './GenerateButton'
import { Gallery } from './Gallery'
import { authClient } from '@/lib/auth-client'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateImagesFn } from '@/server-functions/image-studio'

interface Model {
  id: string
  name: string
  provider: string
}

interface Generation {
  id: string
  prompt: string
  negativePrompt?: string | null
  aspectRatio: string
  createdAt: Date
  images: Array<{
    id: string
    r2Url: string
    modelName: string
    width?: number | null
    height?: number | null
    isPlaceholder?: boolean
  }>
}

interface QueueItem {
  id: string
  prompt: string
  aspectRatios: Array<string>
  modelIds: Array<string>
  modelNames: Array<string>
  selectedStyles: Array<string>
  referenceImageUrls?: Array<{ url: string; key: string; originalName: string }>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

interface StudioLayoutProps {
  models: Array<Model>
  initialGenerations: Array<Generation>
}

export function StudioLayout({
  models,
  initialGenerations,
}: StudioLayoutProps) {
  const router = useRouter()

  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<Array<string>>([])
  const [aspectRatios, setAspectRatios] = useState<Array<string>>(['1:1'])
  const [selectedStyles, setSelectedStyles] = useState<Array<string>>([])
  const [referenceImages, setReferenceImages] = useState<
    Array<{ url: string; key: string; originalName: string }>
  >([])
  const [queue, setQueue] = useState<Array<QueueItem>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingGenerations, setStreamingGenerations] = useState<
    Map<string, EventSource>
  >(new Map())
  const processingRef = useRef(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Local state for generations - initialized from props
  const [generations, setGenerations] =
    useState<Array<Generation>>(initialGenerations)

  // Reset generations when initialGenerations changes (e.g., user switch or refresh)
  // The Gallery component will detect user switches and clear its cache accordingly
  useEffect(() => {
    setGenerations(initialGenerations)
  }, [initialGenerations])

  // SSE connection helper
  const connectToGenerationStream = (generationId: string) => {
    const eventSource = new EventSource(
      `/api/generation/${generationId}/stream`,
    )

    eventSource.onmessage = (event) => {
      try {
        const sseEvent = JSON.parse(event.data)

        switch (sseEvent.type) {
          case 'image_complete': {
            // Update the specific image in local state
            const imageData = sseEvent.data
            setGenerations((prev) =>
              prev.map((gen) => {
                if (gen.id === imageData.generationId) {
                  // Check if image already exists by ID
                  const existingImageIndex = gen.images.findIndex(
                    (img) => img.id === imageData.id,
                  )

                  if (existingImageIndex !== -1) {
                    // Update existing image
                    return {
                      ...gen,
                      images: gen.images.map((img) =>
                        img.id === imageData.id
                          ? {
                              ...img,
                              r2Url: imageData.r2Url,
                              modelName: imageData.modelName,
                              width: imageData.width,
                              height: imageData.height,
                              isPlaceholder: false,
                            }
                          : img,
                      ),
                    }
                  } else {
                    // Check if there's a placeholder for this model
                    const placeholderIndex = gen.images.findIndex(
                      (img) =>
                        img.isPlaceholder &&
                        img.modelName === imageData.modelName,
                    )

                    if (placeholderIndex !== -1) {
                      // Replace placeholder with real image
                      const newImages = [...gen.images]
                      newImages[placeholderIndex] = {
                        id: imageData.id,
                        r2Url: imageData.r2Url,
                        modelName: imageData.modelName,
                        width: imageData.width,
                        height: imageData.height,
                        isPlaceholder: false,
                      }
                      return {
                        ...gen,
                        images: newImages,
                      }
                    } else {
                      // Add new image (no placeholder existed)
                      return {
                        ...gen,
                        images: [
                          ...gen.images,
                          {
                            id: imageData.id,
                            r2Url: imageData.r2Url,
                            modelName: imageData.modelName,
                            width: imageData.width,
                            height: imageData.height,
                            isPlaceholder: false,
                          },
                        ],
                      }
                    }
                  }
                }
                return gen
              }),
            )
            break
          }

          case 'generation_complete': {
            // Clean up
            eventSource.close()
            setStreamingGenerations((prev) => {
              const newMap = new Map(prev)
              newMap.delete(generationId)
              return newMap
            })

            // Update generation locally - remove any remaining placeholders
            // since all images should have been received via image_complete events
            setGenerations((prev) =>
              prev.map((gen) => {
                if (gen.id === generationId) {
                  // Remove any remaining placeholder images
                  const realImages = gen.images.filter(
                    (img) => !img.isPlaceholder,
                  )
                  return {
                    ...gen,
                    images: realImages,
                  }
                }
                return gen
              }),
            )

            toast.success('Generation complete!')
            break
          }

          case 'error':
            toast.error(sseEvent.data.message)
            eventSource.close()
            setStreamingGenerations((prev) => {
              const newMap = new Map(prev)
              newMap.delete(generationId)
              return newMap
            })
            break
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      eventSource.close()
      setStreamingGenerations((prev) => {
        const newMap = new Map(prev)
        newMap.delete(generationId)
        return newMap
      })
      toast.error('Connection lost')
    }

    setStreamingGenerations((prev) =>
      new Map(prev).set(generationId, eventSource),
    )
  }

  // Add to queue with optimistic UI
  const handleAddToQueue = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (selectedModels.length === 0) {
      toast.error('Please select at least one model')
      return
    }

    if (aspectRatios.length === 0) {
      toast.error('Please select at least one aspect ratio')
      return
    }

    const id = Date.now().toString()
    const modelNames = models
      .filter((m) => selectedModels.includes(m.id))
      .map((m) => m.name)

    // Build enhanced prompt with style keywords
    let enhancedPrompt = prompt.trim()
    if (selectedStyles.length > 0) {
      const styleKeywords = selectedStyles
        .map((styleId) => {
          const style = ARTISTIC_STYLES.find((s) => s.id === styleId)
          return style?.keywords || ''
        })
        .filter(Boolean)
        .join(', ')

      if (styleKeywords) {
        enhancedPrompt = `${enhancedPrompt}, ${styleKeywords}`
      }
    }

    // Add to queue
    const newItem: QueueItem = {
      id,
      prompt: enhancedPrompt,
      aspectRatios,
      modelIds: selectedModels,
      modelNames,
      selectedStyles,
      referenceImageUrls:
        referenceImages.length > 0 ? referenceImages : undefined,
      status: 'pending',
    }

    setQueue((prev) => [...prev, newItem])

    toast.success(
      `Queued for generation (${aspectRatios.length} aspect ratio${
        aspectRatios.length > 1 ? 's' : ''
      })`,
    )

    // Clear form for next generation
    setPrompt('')
    setReferenceImages([])
    // Note: We keep selectedStyles, selectedModels, and aspectRatios for convenience
  }

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      // Prevent concurrent execution
      if (processingRef.current || isProcessing) return

      const nextItem = queue.find((item) => item.status === 'pending')
      if (!nextItem) return

      processingRef.current = true
      setIsProcessing(true)

      // Update status to processing
      setQueue((prev) =>
        prev.map((item) =>
          item.id === nextItem.id ? { ...item, status: 'processing' } : item,
        ),
      )

      try {
        // Create a generation for each aspect ratio
        const generationPromises = nextItem.aspectRatios.map((aspectRatio) =>
          generateImagesFn({
            data: {
              prompt: nextItem.prompt,
              aspectRatio,
              modelIds: nextItem.modelIds,
              referenceImageUrls: nextItem.referenceImageUrls,
            },
          }),
        )

        const results = await Promise.all(generationPromises)

        // Add optimistic generations to the front of the list
        const optimisticGenerations: Array<Generation> = results.map(
          (result, index) => ({
            id: result.generationId,
            prompt: nextItem.prompt,
            aspectRatio: nextItem.aspectRatios[index],
            createdAt: new Date(),
            images: nextItem.modelNames.map((modelName) => ({
              id: `${result.generationId}-${modelName}-placeholder`,
              r2Url: '',
              modelName,
              isPlaceholder: true,
            })),
          }),
        )

        setGenerations((prev) => [...optimisticGenerations, ...prev])

        // Connect to SSE stream for each generation
        results.forEach((result) => {
          connectToGenerationStream(result.generationId)
        })

        // Remove from queue since it's now being tracked via SSE
        setQueue((prev) => prev.filter((item) => item.id !== nextItem.id))
      } catch (error) {
        console.error('Generation error:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate images'

        // Remove from queue
        setQueue((prev) => prev.filter((item) => item.id !== nextItem.id))

        toast.error(errorMessage)
      } finally {
        processingRef.current = false
        setIsProcessing(false)
      }
    }

    processQueue()
  }, [queue, isProcessing, router])

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      // Close all SSE connections when component unmounts
      streamingGenerations.forEach((eventSource) => eventSource.close())
    }
  }, [])

  const pendingCount = queue.filter((item) => item.status === 'pending').length
  const processingCount = queue.filter(
    (item) => item.status === 'processing',
  ).length

  const handleLogout = async () => {
    authClient.signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const sidebarContent = (
    <div className="h-full overflow-y-auto flex flex-col relative p-4 sm:p-6">
      {/* Desktop header */}
      <div className="hidden lg:block mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.65 0.22 277 / 0.3) 0%, oklch(0.65 0.22 277 / 0.15) 100%)',
              }}
            >
              <Mountain className="h-4 w-4 sm:h-5 sm:w-5 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-sidebar-foreground">
                Studio
              </h1>
            </div>
            {(pendingCount > 0 || processingCount > 0) && (
              <Badge variant="secondary" className="text-xs">
                {processingCount > 0 ? 'Generating' : `${pendingCount} queued`}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 sm:h-10 sm:w-10"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          AI Image Generation
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6 flex-1">
        <PromptSection value={prompt} onChange={setPrompt} />

        <ModelSelector
          models={models}
          selectedModels={selectedModels}
          onSelectionChange={setSelectedModels}
        />

        <StyleSelector
          selectedStyles={selectedStyles}
          onSelectionChange={setSelectedStyles}
        />

        <AspectRatioSelector value={aspectRatios} onChange={setAspectRatios} />

        <ReferenceImageUpload
          images={referenceImages}
          onImagesChange={setReferenceImages}
        />
      </div>

      {/* Desktop generate button */}
      <div className="hidden lg:block mt-auto pt-4">
        <GenerateButton
          onClick={handleAddToQueue}
          isGenerating={processingCount > 0}
          disabled={
            !prompt.trim() ||
            selectedModels.length === 0 ||
            aspectRatios.length === 0
          }
          selectedModelsCount={selectedModels.length}
          aspectRatios={aspectRatios}
        />
      </div>

      {/* Mobile generate button inside sheet */}
      <div className="lg:hidden mt-auto pt-4 pb-safe border-t border-border">
        <GenerateButton
          onClick={() => {
            handleAddToQueue()
            // Close the sheet after adding to queue
            setMobileSheetOpen(false)
          }}
          isGenerating={processingCount > 0}
          disabled={
            !prompt.trim() ||
            selectedModels.length === 0 ||
            aspectRatios.length === 0
          }
          selectedModelsCount={selectedModels.length}
          aspectRatios={aspectRatios}
        />
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-96 border-r border-border flex-col relative bg-gradient-to-b from-[oklch(0.12_0.02_277)] via-[oklch(0.08_0.01_277)] to-[oklch(0.10_0.015_277)]">
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Overlapping radial gradients using background-blur and opacity */}
          <div className="absolute left-0 top-0 w-2/3 h-2/3 rounded-full bg-[oklch(0.15_0.05_277_/_0.3)] blur-2xl" />
          <div className="absolute right-0 bottom-0 w-2/3 h-2/3 rounded-full bg-[oklch(0.12_0.04_277_/_0.25)] blur-2xl" />
          <div className="absolute left-1/3 top-1/3 w-2/3 h-2/3 rounded-full bg-[oklch(0.10_0.03_277_/_0.15)] blur-3xl" />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        {/* Sticky bottom button for mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe bg-background/95 backdrop-blur-sm border-t border-border">
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="w-full h-14 text-base font-medium rounded-lg relative overflow-hidden touch-manipulation flex items-center justify-center text-foreground shadow-lg hover:opacity-90 active:opacity-80 transition-opacity"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.14 0.02 277) 0%, oklch(0.12 0.015 277) 50%, oklch(0.13 0.018 277) 100%)',
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create Generation
            {(pendingCount > 0 || processingCount > 0) && (
              <Badge
                variant="secondary"
                className="ml-2 text-xs bg-background/20"
              >
                {processingCount > 0 ? 'Generating' : `${pendingCount} queued`}
              </Badge>
            )}
          </button>
        </div>

        <SheetContent
          side="bottom"
          className="max-h-[90vh] p-0 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.65 0.22 277 / 0.3) 0%, oklch(0.65 0.22 277 / 0.15) 100%)',
                }}
              >
                <Mountain className="h-4 w-4 text-primary relative z-10" />
              </div>
              <h2 className="text-lg font-bold">Create Generation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="h-8 w-8"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative lg:pt-0 pb-20 lg:pb-0">
        <Gallery generations={generations} />
      </div>
    </div>
  )
}
