import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DOC_PAGE_IDS } from '@/features/docs/content'
import { Docs } from '@/features/docs'

const docsSearchSchema = z.object({
  page: z.enum(DOC_PAGE_IDS).optional().catch(undefined),
})

export const Route = createFileRoute('/docs/')({
  validateSearch: docsSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { page } = Route.useSearch()

  return <Docs pageId={page} />
}