import { useState, useEffect } from 'react'
import { ExternalLink, Gift, Loader2, WalletCards } from 'lucide-react'
import { SiAlipay, SiPaypal, SiStripe, SiWechat } from 'react-icons/si'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PAYMENT_TYPES } from '../constants'
import { formatCurrency, getPaymentIcon, getMinTopupAmount } from '../lib'
import type {
  PaymentMethod,
  TopupInfo,
  CreemProduct,
  WaffoPayMethod,
} from '../types'
import { CreemProductsSection } from './creem-products-section'

interface RechargeFormCardProps {
  topupInfo: TopupInfo | null
  selectedPaymentMethod?: PaymentMethod
  onSelectPaymentMethod: (method: PaymentMethod) => void
  onPurchase: () => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  paymentAmount: number
  calculating: boolean
  paymentLoading: string | null
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  topupLink?: string
  loading?: boolean
  creemProducts?: CreemProduct[]
  enableCreemTopup?: boolean
  onCreemProductSelect?: (product: CreemProduct) => void
  enableWaffoTopup?: boolean
  waffoPayMethods?: WaffoPayMethod[]
  waffoMinTopup?: number
  onWaffoMethodSelect?: (method: WaffoPayMethod, index: number) => void
  enableWaffoPancakeTopup?: boolean
}

export function RechargeFormCard({
  topupInfo,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPurchase,
  topupAmount,
  onTopupAmountChange,
  paymentAmount,
  calculating,
  paymentLoading,
  redemptionCode,
  onRedemptionCodeChange,
  onRedeem,
  redeeming,
  topupLink,
  loading,
  creemProducts,
  enableCreemTopup,
  onCreemProductSelect,
  enableWaffoTopup,
  waffoPayMethods,
  waffoMinTopup,
  onWaffoMethodSelect,
  enableWaffoPancakeTopup,
}: RechargeFormCardProps) {
  const { t } = useTranslation()
  const [localAmount, setLocalAmount] = useState(topupAmount.toString())

  useEffect(() => {
    setLocalAmount(topupAmount.toString())
  }, [topupAmount])

  const handleAmountChange = (value: string) => {
    setLocalAmount(value)
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      onTopupAmountChange(numValue)
    }
  }

  const hasStandardPaymentMethods =
    Array.isArray(topupInfo?.pay_methods) && topupInfo.pay_methods.length > 0
  const hasWaffoPaymentMethods =
    Array.isArray(waffoPayMethods) && waffoPayMethods.length > 0
  const hasConfigurableTopup =
    hasStandardPaymentMethods ||
    enableWaffoTopup ||
    enableWaffoPancakeTopup
  const hasAnyTopup = hasConfigurableTopup || enableCreemTopup
  const minTopup = getMinTopupAmount(topupInfo)
  const selectedMinTopup = selectedPaymentMethod?.min_topup || minTopup
  const purchaseDisabled =
    !selectedPaymentMethod ||
    topupAmount < selectedMinTopup ||
    paymentLoading === selectedPaymentMethod.type
  const standardMethods = topupInfo?.pay_methods || []
  const walletMethodTypes = [
    PAYMENT_TYPES.ALIPAY,
    PAYMENT_TYPES.WECHAT,
    PAYMENT_TYPES.WECHAT_NATIVE,
  ]
  const stripeMethod = standardMethods.find(
    (method) => method.type === PAYMENT_TYPES.STRIPE
  )
  const walletMethods = standardMethods.filter((method) =>
    walletMethodTypes.includes(method.type as (typeof walletMethodTypes)[number])
  )
  const otherStandardMethods = standardMethods.filter(
    (method) =>
      method.type !== PAYMENT_TYPES.STRIPE &&
      !walletMethodTypes.includes(
        method.type as (typeof walletMethodTypes)[number]
      )
  )
  const selectedWalletMethod = walletMethods.find(
    (method) => method.type === selectedPaymentMethod?.type
  )
  const preferredWalletMethod =
    selectedWalletMethod || walletMethods[0] || undefined
  const walletSelected = Boolean(selectedWalletMethod)
  const walletDisabled =
    walletMethods.length === 0 ||
    walletMethods.every((method) => (method.min_topup || 0) > topupAmount)
  const walletMinTopup = walletMethods.length
    ? Math.min(...walletMethods.map((method) => method.min_topup || 0))
    : 0
  const walletMethodNames = Array.from(
    new Set(walletMethods.map((method) => method.name))
  )

  const renderPrimaryPaymentContent = (method: PaymentMethod) => {
    const normalized = `${method.type} ${method.name}`.toLowerCase()

    if (method.type === 'stripe') {
      return <SiStripe className='h-10 w-[5.15rem] scale-[1.15] text-[#635BFF] sm:h-[2.1rem] sm:w-[6rem]' />
    }

    if (method.type === 'alipay') {
      return <SiAlipay className='h-10 w-10 text-[#1677FF] sm:h-11 sm:w-11' />
    }

    if (method.type === 'wxpay' || method.type === 'wechat_native') {
      return <SiWechat className='h-10 w-10 text-[#07C160] sm:h-11 sm:w-11' />
    }

    if (normalized.includes('paypal')) {
      return <SiPaypal className='h-10 w-10 text-[#003087] sm:h-11 sm:w-11' />
    }

    if (method.icon) {
      return getPaymentIcon(
        method.type,
        'h-10 w-10 sm:h-11 sm:w-11',
        method.icon,
        method.name
      )
    }

    return (
      <div className='flex items-center justify-center gap-3.5 text-[1.65rem] sm:text-[1.85rem]'>
        <SiAlipay className='text-[#1677FF]' />
        <SiWechat className='text-[#07C160]' />
        <SiPaypal className='text-[#003087]' />
        <span className='text-muted-foreground text-2xl leading-none'>...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className='h-full gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent className='flex flex-1 flex-col space-y-4 p-3 sm:space-y-6 sm:p-5'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-16 w-full rounded-2xl sm:h-[68px]' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-full' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-36' />
              <div className='grid grid-cols-2 gap-2'>
                <Skeleton className='h-14 rounded-2xl sm:h-16' />
                <Skeleton className='h-14 rounded-2xl sm:h-16' />
              </div>
            </div>
            <Skeleton className='h-11 w-full rounded-xl' />
          </div>

          {/* Redemption Code Section Skeleton */}
          <div className='mt-auto space-y-3 border-t pt-8'>
            <Skeleton className='h-3 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 w-20' />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TitledCard
      title={t('Recharge')}
      icon={<WalletCards className='h-4 w-4' />}
      contentClassName='flex flex-1 flex-col space-y-4 sm:space-y-6'
      className='h-full border-border/80 bg-gradient-to-br from-background via-background to-primary/5'
    >
      {/* Online Topup Section */}
      {hasAnyTopup ? (
        <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
          {hasConfigurableTopup && (
            <>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='topup-amount'
                    className='text-base font-semibold tracking-tight text-foreground sm:text-lg'
                  >
                    {t('Recharge points')}
                  </Label>
                  <div className='relative'>
                    <Input
                      id='topup-amount'
                      type='number'
                      inputMode='numeric'
                      value={localAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      min={minTopup}
                      placeholder={`Minimum ${minTopup}`}
                      className='h-16 rounded-2xl border-border/80 bg-background px-5 pr-16 text-[2rem] font-semibold tracking-tight sm:h-[68px] sm:px-6 sm:pr-[4.5rem] sm:text-[2.35rem]'
                    />
                    <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5 text-[1.8rem] font-semibold text-foreground sm:pr-6 sm:text-[2.1rem]'>
                      $
                    </div>
                  </div>
                </div>

                <div className='rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3'>
                  <div className='flex items-center justify-between gap-4 text-sm font-semibold sm:text-base'>
                    <span>{t('Total due')}</span>
                    {calculating ? (
                      <Skeleton className='h-6 w-20' />
                    ) : (
                      <span className='tabular-nums'>
                        {formatCurrency(paymentAmount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-2.5 sm:space-y-3'>
                <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  {t('Payment Method')}
                </Label>
                {hasStandardPaymentMethods ? (
                  <div className='grid grid-cols-2 gap-2'>
                    {stripeMethod && (() => {
                      const minTopup = stripeMethod.min_topup || 0
                      const disabled = minTopup > topupAmount
                      const selected =
                        selectedPaymentMethod?.type === stripeMethod.type

                      const button = (
                        <Button
                          key={stripeMethod.type}
                          variant='outline'
                          onClick={() => onSelectPaymentMethod(stripeMethod)}
                          disabled={disabled || !!paymentLoading}
                          className={cn(
                            'h-16 min-w-0 rounded-2xl border-border/80 bg-background px-5 transition-colors hover:border-primary/25 hover:bg-primary/5 sm:h-[4.5rem]',
                            selected &&
                              'border-primary/35 bg-primary/10 text-foreground shadow-sm'
                          )}
                          aria-label={stripeMethod.name}
                        >
                          <span className='flex w-full items-center justify-center'>
                            {renderPrimaryPaymentContent(stripeMethod)}
                            <span className='sr-only'>{stripeMethod.name}</span>
                          </span>
                        </Button>
                      )

                      return disabled ? (
                        <TooltipProvider key={stripeMethod.type}>
                          <Tooltip>
                            <TooltipTrigger render={button}></TooltipTrigger>
                            <TooltipContent>
                              {t('Minimum topup amount: {{amount}}', {
                                amount: minTopup,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        button
                      )
                    })()}

                    {walletMethods.length > 0 && (() => {
                      const button = (
                        <Button
                          key='wallet-group'
                          variant='outline'
                          onClick={() =>
                            preferredWalletMethod &&
                            onSelectPaymentMethod(preferredWalletMethod)
                          }
                          disabled={walletDisabled || !!paymentLoading}
                          className={cn(
                            'h-16 min-w-0 rounded-2xl border-border/80 bg-background px-5 transition-colors hover:border-primary/25 hover:bg-primary/5 sm:h-[4.5rem]',
                            walletSelected &&
                              'border-primary/35 bg-primary/10 text-foreground shadow-sm'
                          )}
                          aria-label={walletMethodNames.join(' / ')}
                        >
                          <span className='flex w-full scale-[1.15] items-center justify-center gap-4 text-[2rem] sm:text-[2.2rem]'>
                            <SiAlipay className='text-[#1677FF]' />
                            <SiWechat className='text-[#07C160]' />
                            <SiPaypal className='text-[#003087]' />
                            <span className='text-muted-foreground text-[1.9rem] leading-none sm:text-[2.1rem]'>...</span>
                          </span>
                        </Button>
                      )

                      return walletDisabled ? (
                        <TooltipProvider key='wallet-group'>
                          <Tooltip>
                            <TooltipTrigger render={button}></TooltipTrigger>
                            <TooltipContent>
                              {t('Minimum topup amount: {{amount}}', {
                                amount: walletMinTopup,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        button
                      )
                    })()}

                    {otherStandardMethods.map((method) => {
                      const minTopup = method.min_topup || 0
                      const disabled = minTopup > topupAmount
                      const selected = selectedPaymentMethod?.type === method.type

                      const button = (
                        <Button
                          key={method.type}
                          variant='outline'
                          onClick={() => onSelectPaymentMethod(method)}
                          disabled={disabled || !!paymentLoading}
                          className={cn(
                            'h-16 min-w-0 rounded-2xl border-border/80 bg-background px-5 transition-colors hover:border-primary/25 hover:bg-primary/5 sm:h-[4.5rem]',
                            selected &&
                              'border-primary/35 bg-primary/10 text-foreground shadow-sm'
                          )}
                          aria-label={method.name}
                        >
                          <span className='flex w-full items-center justify-center'>
                            {renderPrimaryPaymentContent(method)}
                            <span className='sr-only'>{method.name}</span>
                          </span>
                        </Button>
                      )

                      return disabled ? (
                        <TooltipProvider key={method.type}>
                          <Tooltip>
                            <TooltipTrigger render={button}></TooltipTrigger>
                            <TooltipContent>
                              {t('Minimum topup amount: {{amount}}', {
                                amount: minTopup,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        button
                      )
                    })}
                  </div>
                ) : hasWaffoPaymentMethods ? null : (
                  <Alert>
                    <AlertDescription>
                      {t(
                        'No payment methods available. Please contact administrator.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={onPurchase}
                  disabled={purchaseDisabled}
                  className='h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90'
                >
                  {paymentLoading === selectedPaymentMethod?.type ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  {t('Purchase')}
                </Button>

                {topupAmount < selectedMinTopup ? (
                  <p className='text-muted-foreground text-xs'>
                    {t('Minimum topup amount: {{amount}}', {
                      amount: selectedMinTopup,
                    })}
                  </p>
                ) : null}
              </div>

              {enableWaffoTopup &&
                hasWaffoPaymentMethods &&
                onWaffoMethodSelect && (
                  <div className='space-y-2.5 sm:space-y-3'>
                    <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                      {t('Waffo Payment')}
                    </Label>
                    <div className='grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-3'>
                      {waffoPayMethods?.map((method, index) => {
                        const loadingKey = `waffo-${index}`
                        const waffoMin = waffoMinTopup || 0
                        const belowMin = waffoMin > topupAmount

                        const button = (
                          <Button
                            key={`${method.name}-${index}`}
                            variant='outline'
                            onClick={() => onWaffoMethodSelect(method, index)}
                            disabled={belowMin || !!paymentLoading}
                            className='h-9 min-w-0 justify-start gap-2 rounded-lg px-3'
                          >
                            {paymentLoading === loadingKey ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : method.icon ? (
                              <img
                                src={method.icon}
                                alt={method.name}
                                className='h-4 w-4 object-contain'
                              />
                            ) : (
                              getPaymentIcon('waffo')
                            )}
                            <span className='truncate'>{method.name}</span>
                          </Button>
                        )

                        return belowMin ? (
                          <TooltipProvider key={`${method.name}-${index}`}>
                            <Tooltip>
                              <TooltipTrigger render={button}></TooltipTrigger>
                              <TooltipContent>
                                {t('Minimum topup amount: {{amount}}', {
                                  amount: waffoMin,
                                })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          button
                        )
                      })}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            {t(
              'Online topup is not enabled. Please use redemption code or contact administrator.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Creem Products Section */}
      {enableCreemTopup &&
        Array.isArray(creemProducts) &&
        creemProducts.length > 0 &&
        onCreemProductSelect && (
          <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
            <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              {t('Creem Payment')}
            </Label>
            <CreemProductsSection
              products={creemProducts}
              onProductSelect={onCreemProductSelect}
            />
          </div>
        )}

      {/* Redemption Code Section */}
      <div className='mt-auto space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
        <div className='flex items-center gap-2'>
          <Gift className='text-muted-foreground h-4 w-4' />
          <Label
            htmlFor='redemption-code'
            className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
          >
            {t('Have a Code?')}
          </Label>
        </div>
        <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
          <Input
            id='redemption-code'
            value={redemptionCode}
            onChange={(e) => onRedemptionCodeChange(e.target.value)}
            placeholder={t('Enter your redemption code')}
            className='h-9 min-w-0'
          />
          <Button
            onClick={onRedeem}
            disabled={redeeming}
            variant='outline'
            className='h-9 px-4'
          >
            {redeeming && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {t('Redeem')}
          </Button>
        </div>
        {topupLink && (
          <p className='text-muted-foreground text-xs'>
            {t('Need a code?')}{' '}
            <a
              href={topupLink}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex items-center gap-1 underline-offset-4 transition-colors hover:text-primary/80 hover:underline'
            >
              {t('Purchase here')}
              <ExternalLink className='h-3 w-3' />
            </a>
          </p>
        )}
      </div>
    </TitledCard>
  )
}
