const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

interface GenerateImageParams {
  prompt: string
  modelId: string
  aspectRatio?: string
  referenceImageUrls?: Array<string>
}

interface ImageUrlObject {
  type: 'image_url'
  image_url: {
    url: string
  }
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string
      content?: string
      images?: Array<string | ImageUrlObject>
    }
  }>
  error?: {
    message: string
    code: number
  }
}

export async function generateImage({
  prompt,
  modelId,
  aspectRatio,
  referenceImageUrls,
}: GenerateImageParams): Promise<Array<string>> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  // Build message content - include reference images if provided
  let messageContent: any = prompt

  if (referenceImageUrls && referenceImageUrls.length > 0) {
    // For models that support vision, send images + text in content array
    messageContent = [
      {
        type: 'text',
        text: prompt,
      },
      ...referenceImageUrls.map((url) => ({
        type: 'image_url',
        image_url: {
          url: url,
        },
      })),
    ]
  }

  // All current models use chat completions with multimodal
  const requestBody: any = {
    model: modelId,
    messages: [
      {
        role: 'user',
        content: messageContent,
      },
    ],
    modalities: ['image', 'text'],
  }

  // Add aspect ratio config for models that support it
  if (aspectRatio) {
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
    }
  }

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      'X-Title': 'AI Image Studio',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
    )
  }

  const data: OpenRouterResponse = await response.json()

  if (data.error) {
    throw new Error(`OpenRouter API error: ${data.error.message}`)
  }

  // Extract base64 images from multimodal response
  const rawImages = data.choices[0]?.message?.images || []

  if (rawImages.length === 0) {
    return []
  }

  // Normalize images - handle both string format and object format
  const images = rawImages
    .map((img) => {
      if (typeof img === 'string') {
        return img
      } else if (typeof img === 'object' && 'image_url' in img) {
        // OpenRouter returns: { type: 'image_url', image_url: { url: '...' } }
        return img.image_url.url
      } else {
        console.warn('Unknown image format:', img)
        return ''
      }
    })
    .filter(Boolean)

  return images
}
