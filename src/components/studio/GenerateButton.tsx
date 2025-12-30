import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

interface GenerateButtonProps {
  onClick: () => void
  isGenerating: boolean
  disabled: boolean
  selectedModelsCount?: number
  aspectRatios?: string[]
}

export function GenerateButton({
  onClick,
  isGenerating,
  disabled,
  selectedModelsCount = 0,
  aspectRatios = ['1:1'],
}: GenerateButtonProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-foreground border border-border/50 font-medium rounded-lg relative overflow-hidden touch-manipulation min-h-[48px] sm:min-h-[52px] text-sm sm:text-base"
        style={{
          background: disabled
            ? 'oklch(0.12 0.006 285.885)'
            : 'linear-gradient(135deg, oklch(0.14 0.02 277) 0%, oklch(0.12 0.015 277) 50%, oklch(0.13 0.018 277) 100%)',
        }}
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
            Generate
          </>
        )}
      </Button>
      {selectedModelsCount > 0 && (
        <p className="text-xs text-center text-muted-foreground px-1">
          {selectedModelsCount} {selectedModelsCount === 1 ? 'model' : 'models'}{' '}
          · {aspectRatios.length}{' '}
          {aspectRatios.length === 1 ? 'ratio' : 'ratios'}
        </p>
      )}
    </div>
  )
}
