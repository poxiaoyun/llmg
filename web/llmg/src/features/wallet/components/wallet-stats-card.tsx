import { Activity, Coins, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatQuota } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserWalletData } from '../types'

interface WalletStatsCardProps {
  user: UserWalletData | null
  loading?: boolean
}

export function WalletStatsCard(props: WalletStatsCardProps) {
  const { t } = useTranslation()
  if (props.loading) {
    return (
      <div className='overflow-hidden rounded-2xl border bg-gradient-to-br from-background to-muted/30'>
        <div className='grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-end'>
          <div>
            <Skeleton className='h-3.5 w-28' />
            <Skeleton className='mt-4 h-14 w-48' />
            <Skeleton className='mt-4 h-5 w-64' />
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='rounded-xl border bg-background/80 p-4'>
                <Skeleton className='h-3.5 w-16' />
                <Skeleton className='mt-3 h-6 w-24' />
                <Skeleton className='mt-2 h-4 w-20' />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const user = props.user
  const stats = [
    {
      label: t('Total Usage'),
      value: formatQuota(user?.used_quota ?? 0),
      description: t('Lifetime consumption'),
      icon: Coins,
    },
    {
      label: t('API Requests'),
      value: (user?.request_count ?? 0).toLocaleString(),
      description: t('All recorded requests'),
      icon: Activity,
    },
    {
      label: t('Pending Rewards'),
      value: formatQuota(user?.aff_quota ?? 0),
      description: t('Ready to transfer'),
      icon: Sparkles,
    },
  ]

  return (
    <div className='overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted/30'>
      <div className='grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-end'>
        <div className='min-w-0'>
          <div className='text-muted-foreground text-[11px] font-medium tracking-[0.26em] uppercase'>
            {t('Current Balance')}
          </div>
          <div className='mt-4 font-mono text-4xl font-semibold tracking-tight break-all tabular-nums sm:text-6xl'>
            {formatQuota(user?.quota ?? 0)}
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {user?.group ? (
              <Badge variant='secondary' className='h-6 rounded-full px-3'>
                {t('Account Group')}: {user.group}
              </Badge>
            ) : null}
            {user?.email ? (
              <div className='rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground'>
                {user.email}
              </div>
            ) : null}
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          {stats.map((item) => (
            <div
              key={item.label}
              className='rounded-xl border bg-background/80 p-4 backdrop-blur-sm'
            >
              <div className='flex items-center gap-2'>
                <item.icon className='text-muted-foreground size-4 shrink-0' />
                <div className='text-muted-foreground truncate text-[11px] font-medium tracking-[0.2em] uppercase'>
                  {item.label}
                </div>
              </div>
              <div className='mt-3 font-mono text-lg font-semibold tracking-tight tabular-nums sm:text-xl'>
                {item.value}
              </div>
              <div className='text-muted-foreground mt-1.5 text-xs'>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
