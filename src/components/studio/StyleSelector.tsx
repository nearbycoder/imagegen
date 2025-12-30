import { Check, Palette } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export interface ArtisticStyle {
  id: string
  name: string
  keywords: string
  description?: string
}

export const ARTISTIC_STYLES: Array<ArtisticStyle> = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    keywords:
      'photorealistic, ultra-realistic, highly detailed, 8k resolution, professional photography, sharp focus, perfect lighting, cinematic quality, DSLR camera, depth of field, natural colors, realistic textures, high dynamic range, professional composition, studio quality',
    description: 'Ultra-realistic photography style',
  },
  {
    id: 'anime',
    name: 'Anime',
    keywords:
      'anime style, Japanese animation, vibrant colors, cel-shaded, detailed character design, expressive eyes, dynamic poses, high quality animation, manga-inspired, colorful palette, smooth shading, stylized proportions, anime aesthetic, kawaii style',
    description: 'Japanese animation style',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    keywords:
      'oil painting, classical art, rich textures, visible brush strokes, impasto technique, traditional fine art, Renaissance style, masterful technique, rich color palette, dramatic lighting, classical composition, art gallery quality, old master painting style',
    description: 'Traditional oil painting',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    keywords:
      'watercolor painting, soft flowing colors, translucent washes, artistic brushwork, delicate gradients, paper texture visible, soft edges, ethereal quality, pastel tones, fluid colors, traditional watercolor technique, dreamy aesthetic, gentle blending',
    description: 'Soft watercolor aesthetic',
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    keywords:
      'digital art, concept art, highly detailed, vibrant colors, professional digital illustration, crisp lines, smooth gradients, modern art style, digital painting, stylized rendering, high quality artwork, contemporary art, polished finish, digital mastery',
    description: 'Modern digital illustration',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    keywords:
      'pencil sketch, detailed line art, black and white, hand-drawn, artistic sketch, fine lines, cross-hatching, shading techniques, graphite drawing, charcoal sketch, detailed illustration, monochrome art, traditional drawing, sketchbook style',
    description: 'Hand-drawn sketch style',
  },
  {
    id: '3d-render',
    name: '3D Render',
    keywords:
      '3D render, CGI, octane render, highly detailed, photorealistic 3D, professional 3D modeling, advanced lighting, realistic materials, volumetric lighting, ray-traced shadows, 3D graphics, computer-generated imagery, high poly model, studio render',
    description: '3D computer graphics',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    keywords:
      'cyberpunk style, neon lights, futuristic cityscape, dark atmosphere, rain-soaked streets, holographic displays, cyberpunk aesthetic, neon signs, dystopian future, high-tech low-life, electric blue and pink neon, night scene, urban decay, tech noir',
    description: 'Futuristic neon aesthetic',
  },
  {
    id: 'impressionist',
    name: 'Impressionist',
    keywords:
      'impressionist painting, soft brush strokes, visible brushwork, light and color emphasis, plein air style, Monet-inspired, dappled sunlight, loose brushstrokes, vibrant color palette, atmospheric perspective, French impressionism, natural light, artistic movement',
    description: 'Classical impressionist style',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    keywords:
      'minimalist art, clean composition, simple elegant design, modern minimalism, negative space, geometric shapes, monochrome palette, refined simplicity, contemporary design, essential elements only, clean lines, sophisticated simplicity, less is more',
    description: 'Clean and simple design',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    keywords:
      'vintage style, retro aesthetic, aged appearance, classic design, nostalgic feel, sepia tones, film grain, vintage photography, retro color grading, classic era, timeless quality, antique look, old-fashioned charm, period-appropriate styling',
    description: 'Retro vintage aesthetic',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    keywords:
      'fantasy art, magical atmosphere, ethereal beauty, mystical elements, enchanting scene, otherworldly, fantasy illustration, magical realism, enchanted forest, mystical creatures, spellbinding, dreamlike quality, fantasy world, epic fantasy art',
    description: 'Fantasy and magical themes',
  },
]

interface StyleSelectorProps {
  selectedStyles: Array<string>
  onSelectionChange: (selected: Array<string>) => void
}

export function StyleSelector({
  selectedStyles,
  onSelectionChange,
}: StyleSelectorProps) {
  const handleToggle = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      onSelectionChange(selectedStyles.filter((id) => id !== styleId))
    } else {
      onSelectionChange([...selectedStyles, styleId])
    }
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            ARTISTIC STYLES
          </Label>
        </div>
        <div className="h-5 min-w-[60px] flex items-center justify-end">
          {selectedStyles.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs font-medium bg-muted text-muted-foreground"
            >
              {selectedStyles.length} active
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {ARTISTIC_STYLES.map((style) => {
          const isSelected = selectedStyles.includes(style.id)
          return (
            <div
              key={style.id}
              className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-lg border transition-colors cursor-pointer relative overflow-hidden touch-manipulation min-h-[48px] ${
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
              onClick={() => handleToggle(style.id)}
              title={style.description}
            >
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium text-xs sm:text-sm ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {style.name}
                </div>
              </div>
              {isSelected ? (
                <div className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </div>
              ) : (
                <div className="flex-shrink-0 h-4 w-4 rounded-full border-2 border-border" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
