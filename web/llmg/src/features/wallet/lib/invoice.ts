import type { StatusBadgeProps } from '@/components/status-badge'
import type { InvoiceRequestStatus } from '../types'

type InvoiceStatusConfig = {
  variant: StatusBadgeProps['variant']
  label: string
}

export const INVOICE_STATUS_CONFIG: Record<InvoiceRequestStatus, InvoiceStatusConfig> = {
  pending: {
    variant: 'warning',
    label: 'Applying',
  },
  processing: {
    variant: 'info',
    label: 'Invoicing',
  },
  issued: {
    variant: 'success',
    label: 'Invoiced',
  },
  rejected: {
    variant: 'danger',
    label: 'Rejected',
  },
}

export function getInvoiceStatusConfig(
  status?: InvoiceRequestStatus | null
): InvoiceStatusConfig {
  if (!status) {
    return {
      variant: 'neutral',
      label: 'Not Requested',
    }
  }
  return INVOICE_STATUS_CONFIG[status]
}