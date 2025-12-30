import { Clock, LayoutGrid } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GalleryHeaderProps {
  totalCount: number
  viewMode: 'grid' | 'timeline'
  onViewModeChange: (mode: 'grid' | 'timeline') => void
}

export function GalleryHeader({
  totalCount,
  viewMode,
  onViewModeChange,
}: GalleryHeaderProps) {
  return (
    <div
      className="border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between relative gap-3"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.11 0.02 277) 0%, oklch(0.09 0.015 277) 50%, oklch(0.10 0.018 277) 100%)',
      }}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-sm sm:text-base font-semibold text-foreground uppercase tracking-wide truncate">
          {totalCount} {totalCount === 1 ? 'Generation' : 'Generations'}
        </h2>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v)}>
        <TabsList className="bg-muted border-border h-9 sm:h-10">
          <TabsTrigger
            value="grid"
            className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation ${
              viewMode === 'grid'
                ? 'bg-background/50 text-foreground border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={
              viewMode === 'grid'
                ? {
                    background: `
                linear-gradient(135deg, oklch(0.65 0.22 277 / 0.15) 0%, oklch(0.62 0.21 277 / 0.10) 100%),
                oklch(0.12 0.006 285.885 / 0.5)
              `,
                  }
                : undefined
            }
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Grid</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation ${
              viewMode === 'timeline'
                ? 'bg-background/50 text-foreground border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={
              viewMode === 'timeline'
                ? {
                    background: `
                linear-gradient(135deg, oklch(0.65 0.22 277 / 0.15) 0%, oklch(0.62 0.21 277 / 0.10) 100%),
                oklch(0.12 0.006 285.885 / 0.5)
              `,
                  }
                : undefined
            }
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
