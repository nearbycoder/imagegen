import { useEffect, useMemo, useRef, useState } from 'react'
import { GalleryHeader } from './GalleryHeader'
import { GalleryGrid } from './GalleryGrid'
import { GalleryTimeline } from './GalleryTimeline'

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

interface GalleryProps {
  generations: Array<Generation>
}

export function Gallery({ generations }: GalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')

  // Cache image objects by ID to maintain stable references
  const imageCache = useRef<Map<string, any>>(new Map())

  // Clean up stale cache entries periodically
  const currentImageIds = useRef<Set<string>>(new Set())

  // Track generation IDs to detect user switches
  const previousGenerationIdsRef = useRef<Set<string>>(new Set())

  // Clear cache when user switches (detected by completely different generation IDs)
  useEffect(() => {
    const currentGenIds = new Set(generations.map((g) => g.id))
    const previousGenIds = previousGenerationIdsRef.current

    // If we have previous IDs and none of them match current IDs, user switched
    if (previousGenIds.size > 0 && currentGenIds.size > 0) {
      const hasOverlap = Array.from(currentGenIds).some((id) =>
        previousGenIds.has(id),
      )
      if (!hasOverlap) {
        // User switched - clear the cache
        imageCache.current.clear()
        currentImageIds.current.clear()
      }
    }

    // Update tracked generation IDs
    previousGenerationIdsRef.current = currentGenIds
  }, [generations])

  // Helper to get or create cached image object
  const getCachedImage = (
    img: any,
    generationId: string,
    prompt: string,
    aspectRatio: string,
    isPlaceholder: boolean,
  ) => {
    // Use just the image ID as the primary key since it's unique
    const imageId = img.id
    currentImageIds.current.add(imageId)

    // Create a signature of the current image data
    const signature = `${img.r2Url || ''}-${img.modelName}-${isPlaceholder}`

    // Check if we have a cached version
    const cached = imageCache.current.get(imageId)

    // If cached signature matches, return cached object
    if (cached?.signature === signature) {
      return cached.obj
    }

    // Create new image object
    const imageObj = {
      ...img,
      r2Url: img.r2Url || '',
      generationId,
      prompt,
      aspectRatio,
      isPlaceholder,
    }

    // Cache with signature separately
    imageCache.current.set(imageId, { obj: imageObj, signature })
    return imageObj
  }

  // Flatten all images from all generations for grid view - with stable references
  const realImages = useMemo(() => {
    currentImageIds.current.clear()
    const images = generations.flatMap((gen) =>
      gen.images.map((img) =>
        getCachedImage(
          img,
          gen.id,
          gen.prompt,
          gen.aspectRatio || '1:1',
          false,
        ),
      ),
    )

    // Sort images by generation createdAt (desc) then by image id for stable ordering
    images.sort((a, b) => {
      const genA = generations.find((g) => g.id === a.generationId)
      const genB = generations.find((g) => g.id === b.generationId)
      if (genA && genB) {
        const timeDiff = genB.createdAt.getTime() - genA.createdAt.getTime()
        if (timeDiff !== 0) return timeDiff
      }
      return a.id.localeCompare(b.id)
    })

    // Clean up cache entries for images that no longer exist
    const allIds = currentImageIds.current
    for (const [id] of imageCache.current) {
      if (!allIds.has(id)) {
        imageCache.current.delete(id)
      }
    }

    return images
  }, [generations])

  const totalCount = realImages.length

  return (
    <div className="flex flex-col h-full">
      <GalleryHeader
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'grid' ? (
        <GalleryGrid images={realImages} generations={generations} />
      ) : (
        <GalleryTimeline generations={generations} />
      )}
    </div>
  )
}
