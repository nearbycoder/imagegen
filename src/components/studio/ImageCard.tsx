import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Image {
  id: string
  r2Url?: string
  modelName: string
  aspectRatio: string
  width?: number | null
  height?: number | null
  isPlaceholder?: boolean
}

interface ImageCardProps {
  image: Image
  onClick: (imageId: string, isPlaceholder?: boolean) => void
}

// Convert aspect ratio string (e.g., "16:9") to Tailwind class
function getAspectRatioClass(ratio: string): string {
  switch (ratio) {
    case '1:1':
      return 'aspect-square'
    case '16:9':
      return 'aspect-video'
    case '9:16':
      return 'aspect-[9/16]'
    case '4:3':
      return 'aspect-[4/3]'
    case '3:4':
      return 'aspect-[3/4]'
    case '21:9':
      return 'aspect-[21/9]'
    default: {
      // Fallback for any other ratio - use arbitrary value
      const [width, height] = ratio.split(':')
      return `aspect-[${width}/${height}]`
    }
  }
}

export const ImageCard = memo(
  function ImageCard({ image, onClick }: ImageCardProps) {
    // Show loading if it's a placeholder or if there's an r2Url (will be loaded)
    const [isLoading, setIsLoading] = useState(
      () => !!image.isPlaceholder || !!image.r2Url,
    )
    const imgRef = useRef<HTMLImageElement | null>(null)
    const lastUrlRef = useRef<string | undefined>(undefined)
    const aspectRatioClass = getAspectRatioClass(image.aspectRatio || '1:1')

    // Reset loading state only when image URL actually changes
    useEffect(() => {
      // Only reset loading if URL actually changed
      if (image.r2Url !== lastUrlRef.current) {
        lastUrlRef.current = image.r2Url
        if (image.r2Url) {
          setIsLoading(true)
        } else {
          // Show loading for placeholders, otherwise hide loading
          setIsLoading(!!image.isPlaceholder)
        }
      }
    }, [image.r2Url, image.isPlaceholder])

    // Check image loading state immediately after DOM update (e.g., during resize)
    // This ensures cached images don't show loading state when elements are recreated
    useLayoutEffect(() => {
      if (imgRef.current && imgRef.current.complete && image.r2Url) {
        setIsLoading(false)
      }
    })

    // Callback ref to check if image is already loaded (cached) immediately when element is created
    const handleImgRef = (img: HTMLImageElement | null) => {
      imgRef.current = img
      if (img && img.complete && image.r2Url) {
        // Image is already loaded (from cache), hide loading immediately
        setIsLoading(false)
      }
    }

    // Shimmer skeleton for placeholders
    if (image.isPlaceholder) {
      return (
        <Card
          className={`group relative overflow-hidden cursor-default border-border/50 bg-transparent p-0 ${aspectRatioClass}`}
        >
          <div className="relative w-full h-full bg-card">
            {/* Shimmer skeleton */}
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-slide" />
            </div>

            {/* Model name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
              <div className=" rounded-md px-2 sm:px-3 py-1 sm:py-1.5">
                <span className="text-[10px] sm:text-xs font-medium text-white truncate block">
                  {image.modelName}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    // Real image with r2Url
    return (
      <Card
        className={`group relative overflow-hidden cursor-pointer transition-all ring-white/30 ring-1 hover:ring-1 hover:ring-primary/50 border-border/50 bg-transparent p-0 ${aspectRatioClass}`}
        onClick={() => onClick(image.id, image.isPlaceholder)}
      >
        <div className="relative w-full h-full bg-card">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Image with fade-in transition */}
          {image.r2Url && (
            <img
              ref={handleImgRef}
              src={image.r2Url}
              alt="Generated"
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoading ? 'opacity-0' : 'opacity-100',
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          )}

          {/* Model name overlay - always visible */}
          <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
            <div className=" rounded-md px-2 sm:px-3 py-1 sm:py-1.5">
              <span className="text-[10px] sm:text-xs font-medium text-white/60 truncate block">
                {image.modelName}
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    // Only rerender if the image data actually changed
    return (
      prevProps.image.id === nextProps.image.id &&
      prevProps.image.r2Url === nextProps.image.r2Url &&
      prevProps.image.modelName === nextProps.image.modelName &&
      prevProps.image.isPlaceholder === nextProps.image.isPlaceholder
    )
  },
)
