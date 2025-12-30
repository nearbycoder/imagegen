import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { authMiddleware } from '@/middleware/auth'
import { generateImage } from '@/lib/openrouter'
import { uploadBase64Image, uploadFile } from '@/lib/r2'

// Available models for image generation
// Source: https://openrouter.ai/models?fmt=cards&output_modalities=image
export const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-5-image',
    name: 'GPT-5 Image',
    provider: 'OpenAI',
  },
  {
    id: 'openai/gpt-5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'OpenAI',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
  },
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Nano Banana',
    provider: 'Google',
  },
  {
    id: 'bytedance-seed/seedream-4.5',
    name: 'Seedream 4.5',
    provider: 'ByteDance Seed',
  },
  {
    id: 'black-forest-labs/flux.2-max',
    name: 'FLUX.2 Max',
    provider: 'Black Forest Labs',
  },
]

/**
 * Get available models
 */
export const getAvailableModelsFn = createServerFn({ method: 'GET' }).handler(
  () => {
    return AVAILABLE_MODELS
  },
)

/**
 * Background processing function for image generation
 */
async function processImageGeneration(
  generationId: string,
  data: {
    prompt: string
    modelIds: Array<string>
    aspectRatio: string
    referenceImageUrls?: Array<{
      url: string
      key: string
      originalName: string
    }>
  },
) {
  const referenceImageUrls = data.referenceImageUrls?.map((ref) => ref.url)

  try {
    // Process each model sequentially
    for (const modelId of data.modelIds) {
      try {
        // Update model status to processing
        await prisma.generationModel.updateMany({
          where: {
            generationId,
            modelId,
          },
          data: {
            status: 'processing',
          },
        })

        // Generate images
        const base64Images = await generateImage({
          prompt: data.prompt,
          modelId,
          aspectRatio: data.aspectRatio,
          referenceImageUrls,
        })

        // Upload and save each image immediately
        for (const base64Image of base64Images) {
          const uploadResult = await uploadBase64Image(
            base64Image,
            'generated-images',
          )

          const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
          await prisma.image.create({
            data: {
              generationId,
              r2Url: uploadResult.url,
              r2Key: uploadResult.key,
              modelName: model?.name || modelId,
              width: uploadResult.width,
              height: uploadResult.height,
            },
          })
        }

        // Update model status to completed
        await prisma.generationModel.updateMany({
          where: {
            generationId,
            modelId,
          },
          data: {
            status: 'completed',
          },
        })
      } catch (error) {
        console.error(`Error generating images with model ${modelId}:`, error)

        // Save error for SSE to report
        await prisma.generationModel.updateMany({
          where: {
            generationId,
            modelId,
          },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }

    // Mark generation complete
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'completed' },
    })
  } catch (error) {
    console.error('Error in background generation:', error)

    // Mark generation as failed
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'failed' },
    })
  }
}

/**
 * Generate images from multiple models
 */
export const generateImagesFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      prompt: z.string().min(1, 'Prompt is required'),
      negativePrompt: z.string().optional(),
      aspectRatio: z.string().default('1:1'),
      modelIds: z
        .array(z.string())
        .min(1, 'At least one model must be selected'),
      referenceImageUrls: z
        .array(
          z.object({
            url: z.string(),
            key: z.string(),
            originalName: z.string(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user } = context

    try {
      // Create the generation record first
      const generation = await prisma.generation.create({
        data: {
          userId: user.id,
          prompt: data.prompt,
          negativePrompt: data.negativePrompt,
          aspectRatio: data.aspectRatio,
          status: 'processing',
        },
      })

      // Create generation model records
      await Promise.all(
        data.modelIds.map((modelId) => {
          const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
          return prisma.generationModel.create({
            data: {
              generationId: generation.id,
              modelId,
              modelName: model?.name || modelId,
              status: 'pending',
            },
          })
        }),
      )

      // Create reference image records if provided
      if (data.referenceImageUrls && data.referenceImageUrls.length > 0) {
        await Promise.all(
          data.referenceImageUrls.map((refImage) =>
            prisma.referenceImage.create({
              data: {
                generationId: generation.id,
                r2Url: refImage.url,
                r2Key: refImage.key,
                originalName: refImage.originalName,
              },
            }),
          ),
        )
      }

      // Spawn background processing WITHOUT awaiting
      processImageGeneration(generation.id, data).catch((err) =>
        console.error('Background generation error:', err),
      )

      // Return immediately with generation ID
      return {
        generationId: generation.id,
        status: 'processing' as const,
      }
    } catch (error) {
      console.error('Error generating images:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate images',
      )
    }
  })

/**
 * Get user's generations
 */
export const getGenerationsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user } = context

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      include: {
        images: true,
        models: true,
        referenceImages: true,
      },
      orderBy: { createdAt: 'desc' },
      take: data.limit,
      skip: data.offset,
    })

    return generations
  })

/**
 * Get a single generation by ID
 */
export const getGenerationFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const { user } = context

    const generation = await prisma.generation.findFirst({
      where: {
        id: data.id,
        userId: user.id,
      },
      include: {
        images: true,
        models: true,
        referenceImages: true,
      },
    })

    if (!generation) {
      throw new Error('Generation not found')
    }

    return generation
  })

/**
 * Delete a generation
 */
export const deleteGenerationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const { user } = context

    // Verify ownership
    const generation = await prisma.generation.findFirst({
      where: {
        id: data.id,
        userId: user.id,
      },
    })

    if (!generation) {
      throw new Error('Generation not found or unauthorized')
    }

    // Delete (cascades to images, models, and reference images)
    await prisma.generation.delete({
      where: { id: data.id },
    })

    return { success: true }
  })

/**
 * Upload reference image (server-side) - receives base64
 */
export const uploadReferenceImageFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      base64: z.string(),
      fileName: z.string(),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Convert base64 to buffer
    const base64Content = data.base64.split(',')[1] || data.base64
    const buffer = Buffer.from(base64Content, 'base64')

    // Upload to R2
    const result = await uploadFile(
      buffer,
      'reference-images',
      data.fileName,
      data.contentType,
    )

    return {
      url: result.url,
      key: result.key,
      originalName: data.fileName,
    }
  })
