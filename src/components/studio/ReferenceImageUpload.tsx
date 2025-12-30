import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { uploadReferenceImageFn } from '@/server-functions/image-studio'

interface ReferenceImage {
  url: string
  key: string
  originalName: string
}

interface ReferenceImageUploadProps {
  images: Array<ReferenceImage>
  onImagesChange: (images: Array<ReferenceImage>) => void
}

export function ReferenceImageUpload({
  images,
  onImagesChange,
}: ReferenceImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const uploadToR2 = async (file: File): Promise<ReferenceImage> => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Upload via server function
    const result = await uploadReferenceImageFn({
      data: {
        base64,
        fileName: file.name,
        contentType: file.type,
      },
    })

    return result
  }

  const onDrop = useCallback(
    async (acceptedFiles: Array<File>) => {
      if (acceptedFiles.length === 0) return

      setUploading(true)

      try {
        const uploadPromises = acceptedFiles.map((file) => uploadToR2(file))
        const uploadedImages = await Promise.all(uploadPromises)

        onImagesChange([...images, ...uploadedImages])
        toast.success(`Uploaded ${uploadedImages.length} image(s)`)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload images')
      } finally {
        setUploading(false)
      }
    },
    [images, onImagesChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  })

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        REFERENCE IMAGES
      </Label>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors touch-manipulation ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border/50 hover:border-primary/50 hover:bg-accent/30 active:bg-accent/40'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Add images for editing
          </p>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.originalName}
                className="w-full h-20 sm:h-24 object-cover rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 sm:h-6 sm:w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
              >
                <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
