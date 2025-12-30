import { Download, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteGenerationFn } from '@/server-functions/image-studio'

interface Image {
  id: string
  r2Url: string
  modelName: string
  width?: number | null
  height?: number | null
}

interface Generation {
  id: string
  prompt: string
  negativePrompt?: string | null
  aspectRatio: string
  createdAt: Date
}

interface ImageDialogProps {
  image: Image
  generation: Generation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageDialog({
  image,
  generation,
  open,
  onOpenChange,
}: ImageDialogProps) {
  const router = useRouter()

  const handleDownload = async () => {
    try {
      // Fetch the image as a blob to ensure proper download
      const response = await fetch(image.r2Url)
      const blob = await response.blob()

      // Create object URL and download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `generated-${image.modelName.replace(/\s+/g, '-')}-${image.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up object URL
      window.URL.revokeObjectURL(url)
      toast.success('Image downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download image')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteGenerationFn({ data: { id: generation.id } })
      toast.success('Generation deleted')
      onOpenChange(false)
      router.invalidate()
    } catch (error) {
      toast.error('Failed to delete generation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <div className="flex flex-col h-full max-h-[95vh] sm:max-h-[90vh] min-h-0">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {image.modelName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(generation.createdAt), 'PPp')}
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-muted/20 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
              <img
                src={image.r2Url}
                alt="Generated image"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Footer with metadata */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/30 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-2.5 flex-1 min-w-0">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">
                    PROMPT
                  </h3>
                  <p className="text-xs sm:text-sm break-words">
                    {generation.prompt}
                  </p>
                </div>

                {generation.negativePrompt && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-1">
                      NEGATIVE PROMPT
                    </h3>
                    <p className="text-xs sm:text-sm break-words">
                      {generation.negativePrompt}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold">Aspect Ratio:</span>{' '}
                    {generation.aspectRatio}
                  </div>
                  {image.width && image.height && (
                    <div>
                      <span className="font-semibold">Dimensions:</span>{' '}
                      {image.width} × {image.height}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - stacked, right-aligned */}
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none touch-manipulation min-h-[44px]"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive flex-1 sm:flex-none touch-manipulation min-h-[44px]"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
