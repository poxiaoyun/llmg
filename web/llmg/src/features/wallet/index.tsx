import { useState, useEffect, useCallback, useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getSelf } from '@/lib/api'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import { SectionPageLayout } from '@/components/layout'
import { AffiliateRewardsCard } from './components/affiliate-rewards-card'
import { BillingContactCard } from './components/billing-contact-card'
import { BillingHistoryDialog } from './components/dialogs/billing-history-dialog'
import { CreemConfirmDialog } from './components/dialogs/creem-confirm-dialog'
import { PaymentConfirmDialog } from './components/dialogs/payment-confirm-dialog'
import { TransferDialog } from './components/dialogs/transfer-dialog'
import { WeChatPayDialog } from './components/dialogs/wechat-pay-dialog'
import { RechargeFormCard } from './components/recharge-form-card'
import { SubscriptionPlansCard } from './components/subscription-plans-card'
import { WalletStatsCard } from './components/wallet-stats-card'
import { DEFAULT_DISCOUNT_RATE } from './constants'
import { updateUserBillingContact } from './api'
import {
  useTopupInfo,
  usePayment,
  useAffiliate,
  useRedemption,
  useCreemPayment,
  useWaffoPayment,
  useWaffoPancakePayment,
} from './hooks'
import {
  getDefaultPaymentType,
  getMinTopupAmount,
  isWaffoPancakePayment,
} from './lib'
import type {
  BillingContact,
  UserWalletData,
  PaymentMethod,
  CreemProduct,
  WeChatPaymentData,
} from './types'

interface WalletProps {
  initialShowHistory?: boolean
}

export function Wallet(props: WalletProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>()
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [creemDialogOpen, setCreemDialogOpen] = useState(false)
  const [selectedCreemProduct, setSelectedCreemProduct] =
    useState<CreemProduct | null>(null)
  const [wechatDialogOpen, setWeChatDialogOpen] = useState(false)
  const [wechatPayment, setWeChatPayment] = useState<WeChatPaymentData | null>(
    null
  )
  const [billingContactSaving, setBillingContactSaving] = useState(false)

  const { currency } = useSystemConfig()
  const { topupInfo, loading: topupLoading } = useTopupInfo()

  // Calculate effective exchange rate - when display type is USD, use rate of 1
  const effectiveUsdExchangeRate = useMemo(() => {
    return currency?.quotaDisplayType === 'USD'
      ? 1
      : currency?.usdExchangeRate || 1
  }, [currency?.quotaDisplayType, currency?.usdExchangeRate])
  const {
    amount: paymentAmount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
  } = usePayment()
  const {
    affiliateLink,
    loading: affiliateLoading,
    transferQuota,
    transferring,
  } = useAffiliate()
  const { redeeming, redeemCode } = useRedemption()
  const { processing: creemProcessing, processCreemPayment } = useCreemPayment()
  const { processWaffoPayment } = useWaffoPayment()
  const { processing: pancakeProcessing, processWaffoPancakePayment } =
    useWaffoPancakePayment()

  // Fetch and refresh user data
  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (props.initialShowHistory) {
      setBillingDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [props.initialShowHistory])

  // Initialize topup amount when topup info is loaded
  useEffect(() => {
    if (topupInfo && topupAmount === 0) {
      const minTopup = getMinTopupAmount(topupInfo)
      setTopupAmount(minTopup)

      // Calculate initial payment amount with default payment type
      const defaultPaymentType = getDefaultPaymentType(topupInfo)
      calculatePaymentAmount(minTopup, defaultPaymentType)
    }
  }, [topupInfo, topupAmount, calculatePaymentAmount])

  useEffect(() => {
    if (!topupInfo?.pay_methods?.length || selectedPaymentMethod) {
      return
    }

    const defaultPaymentType = getDefaultPaymentType(topupInfo)
    const defaultMethod =
      topupInfo.pay_methods.find((method) => method.type === defaultPaymentType) ||
      topupInfo.pay_methods[0]

    setSelectedPaymentMethod(defaultMethod)
  }, [selectedPaymentMethod, topupInfo])

  // Get current payment type (selected or default)
  const getCurrentPaymentType = useCallback(() => {
    return selectedPaymentMethod?.type || getDefaultPaymentType(topupInfo)
  }, [selectedPaymentMethod, topupInfo])

  // Handle topup amount change
  const handleTopupAmountChange = (amount: number) => {
    setTopupAmount(amount)
    calculatePaymentAmount(amount, getCurrentPaymentType())
  }

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)

    await calculatePaymentAmount(topupAmount, method.type)
  }

  const handlePreparePurchase = async () => {
    if (!selectedPaymentMethod) return

    setPaymentLoading(selectedPaymentMethod.type)

    try {
      const minTopup =
        selectedPaymentMethod.min_topup || getMinTopupAmount(topupInfo)
      if (topupAmount < minTopup) {
        return
      }

      await calculatePaymentAmount(topupAmount, selectedPaymentMethod.type)
      setConfirmDialogOpen(true)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) return

    const isPancake = isWaffoPancakePayment(selectedPaymentMethod.type)
    const result = isPancake
      ? { success: await processWaffoPancakePayment(topupAmount) }
      : await processPayment(topupAmount, selectedPaymentMethod.type)

    if (result.success) {
      if (result.wechatPayment) {
        setWeChatPayment(result.wechatPayment)
        setConfirmDialogOpen(false)
        setWeChatDialogOpen(true)
        return
      }

      setConfirmDialogOpen(false)
      await fetchUser()
    }
  }

  const handleWeChatDialogOpenChange = (open: boolean) => {
    setWeChatDialogOpen(open)
    if (!open) {
      setWeChatPayment(null)
    }
  }

  // Handle redemption
  const handleRedeem = async () => {
    if (!redemptionCode) return

    const success = await redeemCode(redemptionCode)
    if (success) {
      setRedemptionCode('')
      await fetchUser()
    }
  }

  // Handle transfer
  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      await fetchUser()
    }
    return success
  }

  // Handle Creem product selection
  const handleCreemProductSelect = (product: CreemProduct) => {
    setSelectedCreemProduct(product)
    setCreemDialogOpen(true)
  }

  // Handle Creem payment confirmation
  const handleCreemConfirm = async () => {
    if (!selectedCreemProduct) return

    const success = await processCreemPayment(selectedCreemProduct.productId)
    if (success) {
      setCreemDialogOpen(false)
      setSelectedCreemProduct(null)
      await fetchUser()
    }
  }

  const handleWaffoMethodSelect = async (_method: unknown, index: number) => {
    const loadingKey = `waffo-${index}`
    setPaymentLoading(loadingKey)

    try {
      await processWaffoPayment(topupAmount, index)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Get discount rate for current topup amount
  const getDiscountRate = useCallback(() => {
    return topupInfo?.discount?.[topupAmount] || DEFAULT_DISCOUNT_RATE
  }, [topupInfo, topupAmount])

  const handleBillingContactSave = useCallback(
    async (contact: BillingContact) => {
      try {
        setBillingContactSaving(true)
        const response = await updateUserBillingContact(contact)
        if (!response.success) {
          toast.error(response.message || t('Update failed'))
          return false
        }

        const hasValue = Object.values(contact).some(
          (value) => value.trim().length > 0
        )

        setUser((prev) =>
          prev
            ? {
                ...prev,
                billing_contact: hasValue ? contact : undefined,
              }
            : prev
        )
        toast.success(t('Updated successfully'))
        return true
      } catch {
        toast.error(t('Request failed'))
        return false
      } finally {
        setBillingContactSaving(false)
      }
    },
    [t]
  )

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Billing')}</SectionPageLayout.Title>
        <SectionPageLayout.Description>
          {t('Manage balances, payment methods, and invoice-ready account details.')}
        </SectionPageLayout.Description>
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setBillingDialogOpen(true)}
          >
            <Receipt className='mr-2 h-4 w-4' />
            {t('Order History')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6'>
            <WalletStatsCard user={user} loading={userLoading} />

            <div className='grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)] xl:items-stretch'>
              <div id='wallet-add-funds' className='h-full scroll-mt-4'>
                <RechargeFormCard
                  topupInfo={topupInfo}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={handlePaymentMethodSelect}
                  onPurchase={handlePreparePurchase}
                  topupAmount={topupAmount}
                  onTopupAmountChange={handleTopupAmountChange}
                  paymentAmount={paymentAmount}
                  calculating={calculating}
                  paymentLoading={paymentLoading}
                  redemptionCode={redemptionCode}
                  onRedemptionCodeChange={setRedemptionCode}
                  onRedeem={handleRedeem}
                  redeeming={redeeming}
                  topupLink={topupInfo?.topup_link}
                  loading={topupLoading}
                  creemProducts={topupInfo?.creem_products}
                  enableCreemTopup={topupInfo?.enable_creem_topup}
                  onCreemProductSelect={handleCreemProductSelect}
                  enableWaffoTopup={topupInfo?.enable_waffo_topup}
                  waffoPayMethods={topupInfo?.waffo_pay_methods}
                  waffoMinTopup={topupInfo?.waffo_min_topup}
                  onWaffoMethodSelect={handleWaffoMethodSelect}
                  enableWaffoPancakeTopup={
                    topupInfo?.enable_waffo_pancake_topup
                  }
                />
              </div>

              <BillingContactCard
                contact={user?.billing_contact}
                fallbackEmail={user?.email}
                loading={userLoading}
                saving={billingContactSaving}
                onSave={handleBillingContactSave}
              />
            </div>

            <div className='grid gap-4'>
              <SubscriptionPlansCard topupInfo={topupInfo} />

              <AffiliateRewardsCard
                user={user}
                affiliateLink={affiliateLink}
                onTransfer={() => setTransferDialogOpen(true)}
                loading={affiliateLoading}
              />
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <PaymentConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handlePaymentConfirm}
        topupAmount={topupAmount}
        paymentAmount={paymentAmount}
        paymentMethod={selectedPaymentMethod}
        calculating={calculating}
        processing={processing || pancakeProcessing}
        discountRate={getDiscountRate()}
        usdExchangeRate={effectiveUsdExchangeRate}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onConfirm={handleTransfer}
        availableQuota={user?.aff_quota ?? 0}
        transferring={transferring}
      />

      <BillingHistoryDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
      />

      <CreemConfirmDialog
        open={creemDialogOpen}
        onOpenChange={setCreemDialogOpen}
        onConfirm={handleCreemConfirm}
        product={selectedCreemProduct}
        processing={creemProcessing}
      />

      <WeChatPayDialog
        open={wechatDialogOpen}
        payment={wechatPayment}
        onOpenChange={handleWeChatDialogOpenChange}
        onRefresh={fetchUser}
      />
    </>
  )
}
