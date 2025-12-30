import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Clock, Image as ImageIcon } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { ImageDialog } from './ImageDialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

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
  }>
}

interface OptimisticGeneration {
  id: string
  prompt: string
  aspectRatio: string
  createdAt: Date
  images: Array<{
    id: string
    modelName: string
    isPlaceholder: true
  }>
}

interface GalleryTimelineProps {
  generations: Array<Generation>
}

export function GalleryTimeline({ generations }: GalleryTimelineProps) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // Combine real and optimistic generations, sort by date (newest first)
  const allGenerations = [...generations].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Find selected image and generation
  const selectedImage = selectedImageId
    ? allGenerations
        .flatMap((gen) =>
          gen.images.map((img) => ({
            ...img,
            generationId: gen.id,
            prompt: gen.prompt,
            aspectRatio: gen.aspectRatio,
            isPlaceholder: img.isPlaceholder || false,
          })),
        )
        .find((img) => img.id === selectedImageId)
    : null

  const selectedGeneration = selectedImage
    ? allGenerations.find((gen) => gen.id === selectedImage.generationId)
    : null

  // Group generations by date
  const groupedGenerations = allGenerations.reduce(
    (acc, gen) => {
      const dateKey = format(new Date(gen.createdAt), 'yyyy-MM-dd')
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(gen)
      return acc
    },
    {} as Record<string, typeof allGenerations>,
  )

  const sortedDates = Object.keys(groupedGenerations).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  )

  return (
    <>
      <ScrollArea className="flex-1 bg-background min-h-0">
        <div className="p-6">
          {allGenerations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-muted-foreground text-lg mb-2">
                No generations yet
              </p>
              <p className="text-muted-foreground text-sm">
                Start by entering a prompt and selecting models
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((dateKey) => {
                const dateGenerations = groupedGenerations[dateKey]
                const date = new Date(dateKey)
                const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey
                const isYesterday =
                  format(
                    new Date(Date.now() - 24 * 60 * 60 * 1000),
                    'yyyy-MM-dd',
                  ) === dateKey

                let dateLabel = format(date, 'MMMM d, yyyy')
                if (isToday) dateLabel = 'Today'
                else if (isYesterday) dateLabel = 'Yesterday'

                return (
                  <div key={dateKey} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 -mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">
                          {dateLabel}
                        </h3>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="secondary" className="text-xs">
                        {dateGenerations.length}{' '}
                        {dateGenerations.length === 1
                          ? 'generation'
                          : 'generations'}
                      </Badge>
                    </div>

                    {/* Generations for this date */}
                    <div className="space-y-6 ml-4 border-l-2 border-border pl-6">
                      {dateGenerations.map((generation) => {
                        const timeAgo = formatDistanceToNow(
                          new Date(generation.createdAt),
                          { addSuffix: true },
                        )

                        return (
                          <div
                            key={generation.id}
                            className="space-y-3 group/generation"
                          >
                            {/* Generation Header */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground leading-relaxed">
                                    {generation.prompt}
                                  </p>
                                  {generation.negativePrompt && (
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                      <span className="font-medium">
                                        Negative:{' '}
                                      </span>
                                      {generation.negativePrompt}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {generation.aspectRatio}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{timeAgo}</span>
                                <span>•</span>
                                <span>
                                  {format(
                                    new Date(generation.createdAt),
                                    'h:mm a',
                                  )}
                                </span>
                                {generation.images.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      <span>
                                        {generation.images.length}{' '}
                                        {generation.images.length === 1
                                          ? 'image'
                                          : 'images'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Images Grid */}
                            {generation.images.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {generation.images.map((image) => (
                                  <ImageCard
                                    key={image.id}
                                    image={{
                                      ...image,
                                      generationId: generation.id,
                                      prompt: generation.prompt,
                                      aspectRatio: generation.aspectRatio,
                                      isPlaceholder:
                                        image.isPlaceholder || false,
                                    }}
                                    onClick={() =>
                                      !image.isPlaceholder &&
                                      setSelectedImageId(image.id)
                                    }
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

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
