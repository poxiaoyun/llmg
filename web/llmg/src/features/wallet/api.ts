import axios from 'axios'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type {
  RedemptionRequest,
  PaymentRequest,
  AmountRequest,
  AffiliateTransferRequest,
  BillingContact,
  ApiResponse,
  TopupInfoResponse,
  RedemptionResponse,
  AmountResponse,
  PaymentResponse,
  StripePaymentResponse,
  WeChatPaymentResponse,
  AffiliateCodeResponse,
  AffiliateTransferResponse,
  BillingHistoryResponse,
  InvoiceLookupResponse,
  InvoiceListResponse,
  InvoiceRequestRecord,
  CreateInvoiceRequestPayload,
  UpdateInvoiceRequestPayload,
  CompleteOrderRequest,
  CreemPaymentRequest,
  CreemPaymentResponse,
  WaffoPaymentRequest,
  WaffoPaymentResponse,
  WaffoPancakePaymentRequest,
  WaffoPancakePaymentResponse,
} from './types'

// ============================================================================
// Wallet API Functions
// ============================================================================

/**
 * Check if API response is successful
 */
export function isApiSuccess(response: ApiResponse): boolean {
  return response.success === true || response.message === 'success'
}

/**
 * Get topup configuration info
 */
export async function getTopupInfo(): Promise<TopupInfoResponse> {
  const res = await api.get('/api/user/topup/info')
  return res.data
}

/**
 * Redeem a topup code
 */
export async function redeemTopupCode(
  request: RedemptionRequest
): Promise<RedemptionResponse> {
  const res = await api.post('/api/user/topup', request)
  return res.data
}

/**
 * Calculate payment amount for regular payment
 */
export async function calculateAmount(
  request: AmountRequest
): Promise<AmountResponse> {
  const res = await api.post('/api/user/amount', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Calculate payment amount for Stripe payment
 */
export async function calculateStripeAmount(
  request: AmountRequest
): Promise<AmountResponse> {
  const res = await api.post('/api/user/stripe/amount', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Request regular payment
 */
export async function requestPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const res = await api.post('/api/user/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return {
    ...res.data,
    url: res.data.url || (res as unknown as { url?: string }).url,
  }
}

/**
 * Request Stripe payment
 */
export async function requestStripePayment(
  request: PaymentRequest
): Promise<StripePaymentResponse> {
  const res = await api.post('/api/user/stripe/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Request native WeChat payment
 */
export async function requestWeChatPayment(
  request: PaymentRequest
): Promise<WeChatPaymentResponse> {
  const res = await api.post('/api/user/wechat/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Request Creem payment
 */
export async function requestCreemPayment(
  request: CreemPaymentRequest
): Promise<CreemPaymentResponse> {
  const res = await api.post('/api/user/creem/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Request Waffo payment
 */
export async function requestWaffoPayment(
  request: WaffoPaymentRequest
): Promise<WaffoPaymentResponse> {
  const res = await api.post('/api/user/waffo/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Calculate payment amount for Waffo Pancake payment
 */
export async function calculateWaffoPancakeAmount(
  request: AmountRequest
): Promise<AmountResponse> {
  const res = await api.post('/api/user/waffo-pancake/amount', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Request Waffo Pancake payment
 */
export async function requestWaffoPancakePayment(
  request: WaffoPancakePaymentRequest
): Promise<WaffoPancakePaymentResponse> {
  const res = await api.post('/api/user/waffo-pancake/pay', request, {
    skipBusinessError: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Get affiliate code
 */
export async function getAffiliateCode(): Promise<AffiliateCodeResponse> {
  const res = await api.get('/api/user/aff')
  return res.data
}

/**
 * Transfer affiliate quota to balance
 */
export async function transferAffiliateQuota(
  request: AffiliateTransferRequest
): Promise<AffiliateTransferResponse> {
  const res = await api.post('/api/user/aff_transfer', request)
  return res.data
}

/**
 * Save billing contact for current user
 */
export async function updateUserBillingContact(
  contact: BillingContact
): Promise<ApiResponse> {
  const res = await api.put('/api/user/setting', {
    billing_contact: contact,
  })
  return res.data
}

/**
 * Get billing history for current user
 */
export async function getUserBillingHistory(
  page: number,
  pageSize: number,
  keyword?: string
): Promise<ApiResponse<BillingHistoryResponse>> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  })
  if (keyword) {
    params.append('keyword', keyword)
  }
  const res = await api.get(`/api/user/topup/self?${params.toString()}`)
  return res.data
}

/**
 * Get billing history for all users (admin only)
 */
export async function getAllBillingHistory(
  page: number,
  pageSize: number,
  keyword?: string
): Promise<ApiResponse<BillingHistoryResponse>> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  })
  if (keyword) {
    params.append('keyword', keyword)
  }
  const res = await api.get(`/api/user/topup?${params.toString()}`)
  return res.data
}

/**
 * Complete a pending order (admin only)
 */
export async function completeOrder(
  request: CompleteOrderRequest
): Promise<ApiResponse> {
  const res = await api.post('/api/user/topup/complete', request)
  return res.data
}

export async function lookupInvoiceRequests(
  topupIds: number[]
): Promise<ApiResponse<InvoiceLookupResponse>> {
  const res = await api.post('/api/user/invoice/lookup', {
    topup_ids: topupIds,
  })
  return res.data
}

export async function createInvoiceRequest(
  request: CreateInvoiceRequestPayload
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const res = await api.post('/api/user/invoice', request)
  return res.data
}

export async function getAllInvoiceRequests(
  page: number,
  pageSize: number,
  keyword?: string
): Promise<ApiResponse<InvoiceListResponse>> {
  const params = new URLSearchParams({
    p: page.toString(),
    page_size: pageSize.toString(),
  })
  if (keyword) {
    params.append('keyword', keyword)
  }
  const res = await api.get(`/api/user/invoice/requests?${params.toString()}`)
  return res.data
}

export async function updateInvoiceRequest(
  id: number,
  request: UpdateInvoiceRequestPayload
): Promise<ApiResponse> {
  const res = await api.put(`/api/user/invoice/requests/${id}`, request)
  return res.data
}

export async function uploadInvoiceRequestFile(
  id: number,
  file: File
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/user/invoice/requests/${id}/file`, formData)
  return res.data
}

type InvoiceFileScope = 'user' | 'admin'

function getInvoiceFilePath(id: number, scope: InvoiceFileScope): string {
  if (scope === 'admin') {
    return `/api/user/invoice/requests/${id}/file`
  }
  return `/api/user/invoice/files/${id}`
}

function getDownloadFilename(
  contentDisposition?: string,
  fallback = 'invoice-file'
): string {
  if (!contentDisposition) {
    return fallback
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (plainMatch?.[1]) {
    return plainMatch[1]
  }

  return fallback
}

async function extractBlobErrorMessage(data: unknown): Promise<string | null> {
  if (!(data instanceof Blob)) {
    return null
  }

  const text = (await data.text()).trim()
  if (!text) {
    return null
  }

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: { message?: string } }
    return parsed.error?.message || parsed.message || text
  } catch {
    return text
  }
}

async function fetchInvoiceFileBlob(
  id: number,
  scope: InvoiceFileScope,
  fallbackName?: string
): Promise<{ blob: Blob; fileName: string }> {
  try {
    const res = await api.get(getInvoiceFilePath(id, scope), {
      responseType: 'blob',
      skipBusinessError: true,
      skipErrorHandler: true,
      disableDuplicate: true,
    } as Record<string, unknown>)

    return {
      blob: res.data as Blob,
      fileName: getDownloadFilename(
        (res.headers as Record<string, string | undefined>)['content-disposition'],
        fallbackName || 'invoice-file'
      ),
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (await extractBlobErrorMessage(error.response?.data)) ||
        error.response?.data?.message ||
        error.message ||
        'Failed to download invoice'
      toast.error(message)
    } else {
      toast.error('Failed to download invoice')
    }
    throw error
  }
}

export async function downloadInvoiceFile(
  id: number,
  scope: InvoiceFileScope,
  fallbackName?: string
): Promise<void> {
  const { blob, fileName } = await fetchInvoiceFileBlob(id, scope, fallbackName)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function previewInvoiceFile(
  id: number,
  scope: InvoiceFileScope,
  fallbackName?: string
): Promise<void> {
  const previewWindow = window.open('about:blank', '_blank')
  if (previewWindow) {
    previewWindow.opener = null
  }

  try {
    const { blob } = await fetchInvoiceFileBlob(id, scope, fallbackName)
    const url = URL.createObjectURL(blob)

    if (previewWindow) {
      previewWindow.location.replace(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    previewWindow?.close()
    throw error
  }
}
