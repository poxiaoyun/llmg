import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestStripePayment,
  requestWeChatPayment,
  isApiSuccess,
} from '../api'
import {
  isStripePayment,
  isWeChatNativePayment,
  isWaffoPancakePayment,
  submitPaymentForm,
} from '../lib'
import type { WeChatPaymentData } from '../types'

interface PaymentProcessResult {
  success: boolean
  wechatPayment?: WeChatPaymentData
}

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isPancake = isWaffoPancakePayment(paymentType)
        const response = isStripe
          ? await calculateStripeAmount({ amount: topupAmount })
          : isPancake
            ? await calculateWaffoPancakeAmount({ amount: topupAmount })
            : await calculateAmount({ amount: topupAmount })

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch (_error) {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  // Process payment
  const processPayment = useCallback(
    async (
      topupAmount: number,
      paymentType: string
    ): Promise<PaymentProcessResult> => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const isWeChatNative = isWeChatNativePayment(paymentType)
        const amount = Math.floor(topupAmount)

        if (isStripe) {
          const response = await requestStripePayment({
            amount,
            payment_method: 'stripe',
          })

          if (!isApiSuccess(response)) {
            toast.error(response.message || i18next.t('Payment request failed'))
            return { success: false }
          }

          if (response.data?.pay_link) {
            window.open(response.data.pay_link, '_blank')
            toast.success(i18next.t('Redirecting to payment page...'))
            return { success: true }
          }

          return { success: false }
        }

        if (isWeChatNative) {
          const response = await requestWeChatPayment({
            amount,
            payment_method: paymentType,
          })

          if (!isApiSuccess(response)) {
            toast.error(response.message || i18next.t('Payment request failed'))
            return { success: false }
          }

          if (response.data?.code_url) {
            toast.success(i18next.t('WeChat payment QR code generated'))
            return {
              success: true,
              wechatPayment: response.data,
            }
          }

          return { success: false }
        }

        const response = await requestPayment({
          amount,
          payment_method: paymentType,
        })

        if (!isApiSuccess(response)) {
          toast.error(response.message || i18next.t('Payment request failed'))
          return { success: false }
        }

        if (response.url && response.data) {
          submitPaymentForm(response.url, response.data)
          toast.success(i18next.t('Redirecting to payment page...'))
          return { success: true }
        }

        return { success: false }
      } catch (_error) {
        toast.error(i18next.t('Payment request failed'))
        return { success: false }
      } finally {
        setProcessing(false)
      }
    },
    []
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
