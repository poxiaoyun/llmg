import { Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuota } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { CopyButton } from '@/components/copy-button'
import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  loading?: boolean
}

export function AffiliateRewardsCard({
  user,
  affiliateLink,
  onTransfer,
  loading,
}: AffiliateRewardsCardProps) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <TitledCard
        title={<Skeleton className='h-6 w-36' />}
        description={<Skeleton className='mt-2 h-4 w-56' />}
        icon={<Share2 className='h-4 w-4 opacity-0' />}
        className='h-full border-border/80 bg-gradient-to-br from-background via-muted/15 to-muted/30'
        contentClassName='space-y-4'
      >
        <div className='grid grid-cols-3 gap-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-20 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-24 rounded-2xl' />
      </TitledCard>
    )
  }

  const hasRewards = (user?.aff_quota ?? 0) > 0

  return (
    <TitledCard
      title={t('Referral Program')}
      description={t(
        'Earn rewards when your referrals add funds. Transfer accumulated rewards to your balance anytime.'
      )}
      icon={<Share2 className='h-4 w-4' />}
      action={
        hasRewards ? (
          <Button onClick={onTransfer} className='h-9 shrink-0 px-3' size='sm'>
            {t('Transfer to Balance')}
          </Button>
        ) : undefined
      }
      className='h-full border-border/80 bg-gradient-to-br from-background via-muted/15 to-muted/30'
      contentClassName='flex h-full flex-col gap-4'
    >
      <div className='grid grid-cols-3 gap-2'>
        {[
          [t('Pending'), formatQuota(user?.aff_quota ?? 0)],
          [t('Total Earned'), formatQuota(user?.aff_history_quota ?? 0)],
          [t('Invites'), String(user?.aff_count ?? 0)],
        ].map(([label, value]) => (
          <div
            key={label}
            className='rounded-xl border border-border/70 bg-background/75 px-3 py-3 text-center'
          >
            <div className='text-muted-foreground truncate text-[10px] font-medium tracking-[0.24em] uppercase'>
              {label}
            </div>
            <div className='mt-1 truncate text-sm font-semibold tabular-nums sm:text-base'>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-2xl border border-border/70 bg-background/75 p-3'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='text-muted-foreground text-[11px] font-medium tracking-[0.24em] uppercase'>
            {t('Referral Link')}
          </div>
          <div className='text-xs font-medium'>
            {hasRewards
              ? `${t('Pending')} ${formatQuota(user?.aff_quota ?? 0)}`
              : t('Share to start earning')}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Input
            value={affiliateLink}
            readOnly
            className='border-muted bg-background/70 h-10 min-w-0 flex-1 font-mono text-xs'
          />
          <CopyButton
            value={affiliateLink}
            variant='outline'
            className='bg-background size-10 shrink-0'
            iconClassName='size-4'
            tooltip={t('Copy referral link')}
            aria-label={t('Copy referral link')}
          />
        </div>
      </div>

      {!hasRewards && (
        <div className='text-muted-foreground rounded-xl border border-dashed px-3 py-2.5 text-xs leading-5'>
          {t('Share your link with teammates or clients and settled rewards will appear here automatically.')}
        </div>
      )}
    </TitledCard>
  )
}
