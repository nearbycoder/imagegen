import { Check, Zap } from 'lucide-react'
import { ProviderIcon } from './ProviderIcon'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Model {
  id: string
  name: string
  provider: string
}

interface ModelSelectorProps {
  models: Array<Model>
  selectedModels: Array<string>
  onSelectionChange: (selected: Array<string>) => void
}

export function ModelSelector({
  models,
  selectedModels,
  onSelectionChange,
}: ModelSelectorProps) {
  const handleToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((id) => id !== modelId))
    } else {
      onSelectionChange([...selectedModels, modelId])
    }
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            MODELS
          </Label>
        </div>
        <div className="h-5 min-w-[60px] flex items-center justify-end">
          {selectedModels.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs font-medium bg-muted text-muted-foreground"
            >
              {selectedModels.length} active
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id)
          return (
            <div
              key={model.id}
              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-colors cursor-pointer relative overflow-hidden touch-manipulation min-h-[56px] ${
                isSelected
                  ? 'border-primary/50'
                  : 'bg-background border-border/50 hover:bg-accent/30 hover:border-border active:bg-accent/40'
              }`}
              style={
                isSelected
                  ? {
                      background: `
                  linear-gradient(135deg, oklch(0.65 0.22 277 / 0.2) 0%, oklch(0.62 0.21 277 / 0.15) 50%, oklch(0.60 0.20 277 / 0.2) 100%),
                  linear-gradient(135deg, oklch(0.14 0.02 277) 0%, oklch(0.12 0.015 277) 100%)
                `,
                    }
                  : {
                      background:
                        'linear-gradient(135deg, oklch(0.14 0.02 277) 0%, oklch(0.12 0.015 277) 100%)',
                    }
              }
              onClick={() => handleToggle(model.id)}
            >
              {/* Provider icon */}
              <ProviderIcon
                provider={model.provider}
                className={
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {model.name}
                </div>
                <div
                  className={`text-xs ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}
                >
                  {model.provider}
                </div>
              </div>
              {isSelected ? (
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary" />
                </div>
              ) : (
                <div className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-border" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
