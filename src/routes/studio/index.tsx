import { createFileRoute } from '@tanstack/react-router'
import { authMiddleware } from '@/middleware/auth'
import {
  getAvailableModelsFn,
  getGenerationsFn,
} from '@/server-functions/image-studio'
import { StudioLayout } from '@/components/studio/StudioLayout'

export const Route = createFileRoute('/studio/')({
  component: StudioPage,
  server: {
    middleware: [authMiddleware],
  },
  loader: async () => {
    const [models, generations] = await Promise.all([
      getAvailableModelsFn(),
      getGenerationsFn({ data: { limit: 50, offset: 0 } }),
    ])

    return { models, generations }
  },
})

function StudioPage() {
  const { models, generations } = Route.useLoaderData()

  return <StudioLayout models={models} initialGenerations={generations} />
}
