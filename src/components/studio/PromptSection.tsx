import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'

interface PromptSectionProps {
  value: string
  onChange: (value: string) => void
}

export function PromptSection({ value, onChange }: PromptSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <Label
          htmlFor="prompt"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          PROMPT
        </Label>
      </div>
      <Textarea
        id="prompt"
        placeholder="Describe your image..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-none bg-background border-input text-foreground placeholder:text-muted-foreground rounded-lg text-sm sm:text-base"
      />
    </div>
  )
}
