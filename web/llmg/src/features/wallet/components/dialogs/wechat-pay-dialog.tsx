import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { formatTimestampToDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CopyButton } from '@/components/copy-button'
import type { WeChatPaymentData } from '../../types'

interface WeChatPayDialogProps {
  open: boolean
  payment: WeChatPaymentData | null
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function WeChatPayDialog({
  open,
  payment,
  onOpenChange,
  onRefresh,
}: WeChatPayDialogProps) {
  const { t } = useTranslation()

  const handleOpenWeChat = () => {
    if (!payment?.code_url) {
      return
    }
    window.location.href = payment.code_url
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('Scan to pay with WeChat')}</DialogTitle>
          <DialogDescription>
            {t('Use WeChat on your phone to scan the QR code and complete payment')}
          </DialogDescription>
        </DialogHeader>

        {payment ? (
          <div className='space-y-4 py-2'>
            <div className='flex justify-center rounded-xl bg-white p-4'>
              <QRCodeSVG value={payment.code_url} size={220} />
            </div>

            <div className='space-y-3 rounded-lg border p-3 text-sm'>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>
                  {t('Order No.')}
                </span>
                <div className='flex items-center gap-2'>
                  <span className='max-w-[180px] truncate font-mono text-xs'>
                    {payment.trade_no}
                  </span>
                  <CopyButton
                    value={payment.trade_no}
                    variant='ghost'
                    size='icon'
                    tooltip={t('Copy order number')}
                    aria-label={t('Copy order number')}
                  />
                </div>
              </div>

              {payment.expires_at ? (
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-muted-foreground'>
                    {t('Expires At')}
                  </span>
                  <span>{formatTimestampToDate(payment.expires_at)}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter className='grid grid-cols-2 gap-2 sm:flex'>
          <Button variant='outline' onClick={onRefresh}>
            {t('Refresh Balance')}
          </Button>
          <Button onClick={handleOpenWeChat} disabled={!payment?.code_url}>
            {t('Open WeChat')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}