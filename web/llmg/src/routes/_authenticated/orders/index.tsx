import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'

const ordersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/orders/')({
  validateSearch: ordersSearchSchema,
  component: Orders,
})
