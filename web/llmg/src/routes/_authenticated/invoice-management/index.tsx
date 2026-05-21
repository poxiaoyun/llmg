import z from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { InvoiceManagement } from '@/features/invoice-management'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const invoiceManagementSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/invoice-management/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({ to: '/403' })
    }
  },
  validateSearch: invoiceManagementSearchSchema,
  component: InvoiceManagement,
})
