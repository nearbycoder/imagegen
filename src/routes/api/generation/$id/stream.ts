import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/generation/$id/stream')({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request
        params: { id: string }
      }) => {
        const generationId = params.id

        // Auth check
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response('Unauthorized', { status: 401 })
        }

        // Verify ownership
        const generation = await prisma.generation.findFirst({
          where: { id: generationId, userId: session.user.id },
        })

        if (!generation) {
          return new Response('Not found', { status: 404 })
        }

        let lastImageTimestamp: Date | null = null
        let isComplete = false
        let pollInterval: NodeJS.Timeout | null = null

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()

            const sendEvent = (data: string) => {
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            // Polling function
            const poll = async () => {
              if (isComplete) return

              try {
                // Get new images since last poll
                const images = await prisma.image.findMany({
                  where: {
                    generationId,
                    ...(lastImageTimestamp
                      ? {
                          createdAt: { gt: lastImageTimestamp },
                        }
                      : {}),
                  },
                  orderBy: { createdAt: 'asc' },
                })

                // Send event for each new image
                for (const image of images) {
                  sendEvent(
                    JSON.stringify({
                      type: 'image_complete',
                      data: {
                        id: image.id,
                        generationId: image.generationId,
                        r2Url: image.r2Url,
                        modelName: image.modelName,
                        width: image.width,
                        height: image.height,
                        createdAt: image.createdAt,
                      },
                    }),
                  )
                  lastImageTimestamp = image.createdAt
                }

                // Check if generation complete
                const updatedGeneration = await prisma.generation.findUnique({
                  where: { id: generationId },
                  include: { images: true },
                })

                if (
                  updatedGeneration?.status === 'completed' ||
                  updatedGeneration?.status === 'failed'
                ) {
                  isComplete = true

                  sendEvent(
                    JSON.stringify({
                      type: 'generation_complete',
                      data: {
                        generationId,
                        status: updatedGeneration.status,
                        totalImages: updatedGeneration.images.length,
                      },
                    }),
                  )

                  if (pollInterval) clearInterval(pollInterval)
                  controller.close()
                }
              } catch (error) {
                console.error('SSE poll error:', error)
                sendEvent(
                  JSON.stringify({
                    type: 'error',
                    data: { message: 'Polling error' },
                  }),
                )
              }
            }

            // Poll every 500ms
            pollInterval = setInterval(poll, 500)

            // Initial poll
            poll()
          },
          cancel() {
            if (pollInterval) clearInterval(pollInterval)
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
