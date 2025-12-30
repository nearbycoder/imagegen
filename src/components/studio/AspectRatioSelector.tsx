import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', icon: 'square' },
  { id: '16:9', label: '16:9', icon: 'wide' },
  { id: '9:16', label: '9:16', icon: 'tall' },
  { id: '4:3', label: '4:3', icon: 'standard' },
  { id: '3:4', label: '3:4', icon: 'portrait' },
  { id: '21:9', label: '21:9', icon: 'ultrawide' },
]

function AspectRatioIcon({
  type,
  isSelected,
}: {
  type: string
  isSelected: boolean
}) {
  const borderColor = isSelected ? 'border-primary' : 'border-muted-foreground'

  let aspectClass = ''
  let widthClass = ''

  switch (type) {
    case 'square':
      aspectClass = 'aspect-square'
      widthClass = 'w-4'
      break
    case 'wide':
      aspectClass = 'aspect-[16/9]'
      widthClass = 'w-5'
      break
    case 'tall':
      aspectClass = 'aspect-[9/16]'
      widthClass = 'w-2.5'
      break
    case 'standard':
      aspectClass = 'aspect-[4/3]'
      widthClass = 'w-4'
      break
    case 'portrait':
      aspectClass = 'aspect-[3/4]'
      widthClass = 'w-3'
      break
    case 'ultrawide':
      aspectClass = 'aspect-[21/9]'
      widthClass = 'w-5'
      break
    default:
      return null
  }

  return (
    <div
      className={`${widthClass} ${aspectClass} ${borderColor} border bg-transparent`}
    />
  )
}

interface AspectRatioSelectorProps {
  value: Array<string>
  onChange: (value: Array<string>) => void
}

export function AspectRatioSelector({
  value,
  onChange,
}: AspectRatioSelectorProps) {
  const handleToggle = (ratioId: string) => {
    if (value.includes(ratioId)) {
      onChange(value.filter((id) => id !== ratioId))
    } else {
      onChange([...value, ratioId])
    }
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          ASPECT RATIO
        </Label>
        {value.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {value.length} selected
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 sm:flex sm:gap-2 gap-1.5">
        {ASPECT_RATIOS.map((ratio) => {
          const isSelected = value.includes(ratio.id)
          return (
            <Button
              key={ratio.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle(ratio.id)}
              className={`flex flex-col items-center justify-center flex-1 sm:min-w-0 px-1.5 sm:px-2 h-auto min-h-[56px] sm:min-h-0 py-1.5 sm:py-2 relative overflow-hidden touch-manipulation ${
                isSelected
                  ? 'text-primary border-primary/50'
                  : 'border-border/50 text-muted-foreground hover:border-border'
              }`}
              style={{
                aspectRatio: '1 / 1',
                ...(isSelected
                  ? {
                      background: `
                        linear-gradient(135deg, oklch(0.65 0.22 277 / 0.25) 0%, oklch(0.62 0.21 277 / 0.20) 50%, oklch(0.60 0.20 277 / 0.25) 100%),
                        linear-gradient(135deg, oklch(0.16 0.02 277) 0%, oklch(0.14 0.015 277) 50%, oklch(0.15 0.018 277) 100%)
                      `,
                    }
                  : {
                      background:
                        'linear-gradient(135deg, oklch(0.16 0.02 277) 0%, oklch(0.14 0.015 277) 50%, oklch(0.15 0.018 277) 100%)',
                    }),
              }}
            >
              <div className="flex-1 flex items-center justify-center w-full min-h-5">
                <AspectRatioIcon type={ratio.icon} isSelected={isSelected} />
              </div>
              <span className="text-xs font-medium whitespace-nowrap leading-none mt-auto">
                {ratio.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
