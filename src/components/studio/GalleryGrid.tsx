import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useContainerPosition,
  useMasonry,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import { ImageCard } from './ImageCard'
import { ImageDialog } from './ImageDialog'
import type { ReactElement } from 'react'

// Client-only masonry component to avoid SSR issues with ResizeObserver
function ClientMasonry({
  images,
  containerRef,
  scrollTop,
  isScrolling,
  height,
  width,
  onImageClick,
}: {
  images: Array<Image>
  containerRef: React.RefObject<HTMLDivElement | null>
  scrollTop: number
  isScrolling: boolean
  height: number
  width: number
  onImageClick: (imageId: string, isPlaceholder?: boolean) => void
}) {
  // Create a version key that changes when images are added or updated
  // This ensures the positioner recalculates when images change
  const imagesVersion = useMemo(() => {
    // Create a version based on image IDs and whether they're loaded
    // This will change when images are added or when placeholders become real images
    return images
      .map((img) => `${img.id}:${img.r2Url ? 'loaded' : 'placeholder'}`)
      .join('|')
  }, [images])

  // Create positioner for masonry layout
  // Responsive column width: smaller on mobile, larger on desktop
  // Include imagesVersion in dependencies to trigger reflow when images are added/updated
  const columnWidth = useMemo(() => {
    if (typeof window === 'undefined') return 250
    // Mobile: ~150px, Tablet: ~200px, Desktop: ~250px
    if (width < 640) return 150 // sm breakpoint
    if (width < 1024) return 200 // lg breakpoint
    return 250
  }, [width])

  const positioner = usePositioner({ width, columnWidth, columnGutter: 12 }, [
    width,
    imagesVersion,
    columnWidth,
  ])

  // Create resize observer for auto-resizing items
  // Always call hook (hook rules) - this component only renders on client
  const resizeObserver = useResizeObserver(positioner)

  // Render function for masonic
  const renderMasonryCard = useCallback(
    ({
      data: image,
    }: {
      index: number
      data: Image
      width: number
    }): ReactElement => {
      return <ImageCard image={image} onClick={onImageClick} />
    },
    [onImageClick],
  )

  // Use masonry hook with container scrolling
  return useMasonry({
    positioner,
    scrollTop,
    isScrolling,
    height,
    containerRef,
    resizeObserver,
    items: images,
    render: renderMasonryCard,
    itemKey: (data: Image) => data.id,
    itemHeightEstimate: 300,
    overscanBy: 2,
  })
}

interface Image {
  id: string
  r2Url: string
  modelName: string
  generationId: string
  prompt: string
  aspectRatio: string
  width?: number | null
  height?: number | null
  isPlaceholder?: boolean
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

interface GalleryGridProps {
  images: Array<Image>
  generations: Array<Generation>
}

export function GalleryGrid({ images, generations }: GalleryGridProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Track if we're on the client side (for SSR)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const selectedImage = selectedImageId
    ? images.find((img) => img.id === selectedImageId)
    : null

  const selectedGeneration = selectedImage
    ? generations.find((gen) => gen.id === selectedImage.generationId)
    : null

  const handleImageClick = useCallback(
    (imageId: string, isPlaceholder?: boolean) => {
      if (!isPlaceholder) {
        setSelectedImageId(imageId)
      }
    },
    [],
  )

  // Track container width for responsive updates
  // Initialize with a default to avoid layout issues
  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      return containerRef.current.offsetWidth || 0
    }
    return 0
  })

  // Get container position and width - update when containerWidth changes
  const { width } = useContainerPosition(containerRef, [containerWidth])

  // Observe container width changes for responsive layout
  useEffect(() => {
    if (!isClient) return

    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const currentContainer = containerRef.current
      if (!currentContainer) return

      const newWidth = currentContainer.offsetWidth
      // Only update if width actually changed to avoid unnecessary re-renders
      setContainerWidth((prev) => (prev !== newWidth ? newWidth : prev))
    }

    // Initial measurement with a small delay to ensure container is laid out
    const timeoutId = setTimeout(updateWidth, 0)

    // Use ResizeObserver if available (more accurate and efficient)
    if (typeof ResizeObserver !== 'undefined') {
      const widthResizeObserver = new ResizeObserver(updateWidth)
      widthResizeObserver.observe(container)

      return () => {
        clearTimeout(timeoutId)
        widthResizeObserver.disconnect()
      }
    } else {
      // Fallback to window resize listener
      window.addEventListener('resize', updateWidth)
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', updateWidth)
      }
    }
  }, [isClient])

  // Track scroll position of the scroll container
  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
      setIsScrolling(true)

      clearTimeout(scrollTimeoutRef.current)

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  // Get scroll container height
  const [height, setHeight] = useState(0)
  useEffect(() => {
    if (!isClient) return

    const scrollElement = scrollElementRef.current
    if (!scrollElement || typeof ResizeObserver === 'undefined') return

    const updateHeight = () => {
      setHeight(scrollElement.clientHeight)
    }

    updateHeight()
    const heightResizeObserver = new ResizeObserver(updateHeight)
    heightResizeObserver.observe(scrollElement)

    return () => heightResizeObserver.disconnect()
  }, [isClient])

  return (
    <>
      <div
        ref={scrollElementRef}
        className="flex-1 bg-background overflow-auto"
      >
        <div ref={containerRef} className="p-2 sm:p-4 md:p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <p className="text-muted-foreground text-base sm:text-lg mb-2">
                No generations yet
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm text-center px-4">
                Start by entering a prompt and selecting models
              </p>
            </div>
          ) : height > 0 && width > 0 && isClient ? (
            <ClientMasonry
              images={images}
              containerRef={containerRef}
              scrollTop={scrollTop}
              isScrolling={isScrolling}
              height={height}
              width={width}
              onImageClick={handleImageClick}
            />
          ) : null}
        </div>
      </div>

      {selectedImage && selectedGeneration && (
        <ImageDialog
          image={selectedImage}
          generation={selectedGeneration}
          open={!!selectedImageId}
          onOpenChange={(open) => !open && setSelectedImageId(null)}
        />
      )}
    </>
  )
}
