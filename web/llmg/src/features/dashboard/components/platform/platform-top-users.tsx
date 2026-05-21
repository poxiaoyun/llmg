import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { VChart } from '@visactor/react-vchart'
import { Loader2, TrendingUp, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber, formatPercent, formatQuota, formatTokens } from '@/lib/format'
import type { TimeGranularity } from '@/lib/time'
import { VCHART_OPTION } from '@/lib/vchart'
import { useThemeCustomization } from '@/context/theme-customization-provider'
import { useTheme } from '@/context/theme-provider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUserQuotaDataByUsers } from '@/features/dashboard/api'
import { processUserChartData } from '@/features/dashboard/lib'
import type { QuotaDataItem } from '@/features/dashboard/types'

let themeManagerPromise: Promise<
  (typeof import('@visactor/vchart'))['ThemeManager']
> | null = null

const TOP_USER_LIMIT_OPTIONS = [5, 10, 20]

type PlatformTopUsersProps = {
  timeRange: {
    start_timestamp: number
    end_timestamp: number
  }
  timeGranularity: TimeGranularity
}

type LeaderboardItem = {
  username: string
  quota: number
  count: number
  tokens: number
  share: number
}

function buildLeaderboard(
  data: QuotaDataItem[],
  limit: number
): LeaderboardItem[] {
  const userTotals = new Map<
    string,
    { quota: number; count: number; tokens: number }
  >()

  for (const item of data) {
    const username = item.username || 'unknown'
    const previous = userTotals.get(username) || { quota: 0, count: 0, tokens: 0 }
    userTotals.set(username, {
      quota: previous.quota + (Number(item.quota) || 0),
      count: previous.count + (Number(item.count) || 0),
      tokens: previous.tokens + (Number(item.token_used) || 0),
    })
  }

  const totalQuota = Array.from(userTotals.values()).reduce(
    (sum, item) => sum + item.quota,
    0
  )

  return Array.from(userTotals.entries())
    .map(([username, value]) => ({
      username,
      quota: value.quota,
      count: value.count,
      tokens: value.tokens,
      share: totalQuota > 0 ? (value.quota / totalQuota) * 100 : 0,
    }))
    .sort((a, b) => b.quota - a.quota)
    .slice(0, limit)
}

export function PlatformTopUsers(props: PlatformTopUsersProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { customization } = useThemeCustomization()
  const [themeReady, setThemeReady] = useState(false)
  const [topUserLimit, setTopUserLimit] = useState(10)
  const themeManagerRef = useRef<
    (typeof import('@visactor/vchart'))['ThemeManager'] | null
  >(null)

  useEffect(() => {
    const updateTheme = async () => {
      setThemeReady(false)

      if (!themeManagerPromise) {
        themeManagerPromise = import('@visactor/vchart').then(
          (m) => m.ThemeManager
        )
      }

      const ThemeManager = await themeManagerPromise
      themeManagerRef.current = ThemeManager
      ThemeManager.setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
      setThemeReady(true)
    }

    updateTheme()
  }, [resolvedTheme])

  const topUsersQuery = useQuery({
    queryKey: [
      'dashboard-platform-top-users',
      props.timeRange.start_timestamp,
      props.timeRange.end_timestamp,
    ],
    queryFn: () => getUserQuotaDataByUsers(props.timeRange),
    select: (res) => (res.success ? res.data : []),
    staleTime: 60_000,
    retry: false,
  })

  const userData = topUsersQuery.data ?? []
  const chartData = useMemo(
    () =>
      processUserChartData(
        topUsersQuery.isLoading ? [] : userData,
        props.timeGranularity,
        t,
        topUserLimit,
        customization.preset
      ),
    [
      customization.preset,
      props.timeGranularity,
      t,
      topUserLimit,
      topUsersQuery.isLoading,
      userData,
    ]
  )
  const leaderboard = useMemo(
    () => buildLeaderboard(userData, topUserLimit),
    [topUserLimit, userData]
  )

  return (
    <section className='space-y-3 sm:space-y-4'>
      <div className='flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div>
          <div className='flex items-center gap-2 text-sm font-semibold'>
            <Users className='text-muted-foreground/60 size-4' />
            {t('Top Users')}
          </div>
          <div className='text-muted-foreground mt-1 text-xs'>
            {t('Share')} / {t('Quota')} / {t('Requests')} / {t('Total Tokens')}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='bg-muted/60 inline-flex h-8 overflow-x-auto rounded-lg border p-0.5'>
            {TOP_USER_LIMIT_OPTIONS.map((limit) => (
              <button
                key={limit}
                type='button'
                onClick={() => setTopUserLimit(limit)}
                className={`shrink-0 rounded-md px-3 text-xs font-medium transition-colors ${
                  topUserLimit === limit
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('Top {{count}}', { count: limit })}
              </button>
            ))}
          </div>
          {topUsersQuery.isFetching && (
            <Loader2 className='text-muted-foreground size-4 animate-spin' />
          )}
        </div>
      </div>

      <div className='grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
        <div className='overflow-hidden rounded-lg border'>
          <div className='h-[300px] p-1.5 sm:h-96 sm:p-2'>
            {topUsersQuery.isLoading ? (
              <Skeleton className='h-full w-full' />
            ) : (
              themeReady && (
                <VChart
                  key={`platform-users-rank-${topUserLimit}-${resolvedTheme}-${customization.preset}`}
                  spec={{
                    ...chartData.spec_user_rank,
                    theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                    background: 'transparent',
                  }}
                  option={VCHART_OPTION}
                />
              )
            )}
          </div>
        </div>

        <div className='overflow-hidden rounded-lg border'>
          <div className='border-b px-3 py-2 sm:px-5 sm:py-3'>
            <div className='text-sm font-semibold'>{t('Top Users')}</div>
          </div>
          <Table className='border-0'>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>#</TableHead>
                <TableHead>{t('User')}</TableHead>
                <TableHead className='text-right'>{t('Quota')}</TableHead>
                <TableHead className='text-right'>{t('Requests')}</TableHead>
                <TableHead className='text-right'>{t('Total Tokens')}</TableHead>
                <TableHead className='text-right'>{t('Share')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsersQuery.isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className='h-4 w-6' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-4 w-24' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='ml-auto h-4 w-20' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='ml-auto h-4 w-16' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='ml-auto h-4 w-16' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='ml-auto h-4 w-16' />
                      </TableCell>
                    </TableRow>
                  ))
                : leaderboard.length > 0
                  ? leaderboard.map((item, index) => (
                      <TableRow key={item.username}>
                        <TableCell className='font-mono tabular-nums'>
                          {index + 1}
                        </TableCell>
                        <TableCell className='max-w-[160px] truncate font-medium'>
                          {item.username}
                        </TableCell>
                        <TableCell className='text-right font-mono tabular-nums'>
                          {formatQuota(item.quota)}
                        </TableCell>
                        <TableCell className='text-right font-mono tabular-nums'>
                          {formatNumber(item.count)}
                        </TableCell>
                        <TableCell className='text-right font-mono tabular-nums'>
                          {formatTokens(item.tokens)}
                        </TableCell>
                        <TableCell className='text-right font-mono tabular-nums'>
                          {formatPercent(item.share)}
                        </TableCell>
                      </TableRow>
                    ))
                  : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-muted-foreground py-8 text-center'
                        >
                          {t('No data available')}
                        </TableCell>
                      </TableRow>
                    )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <div className='flex items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
          <TrendingUp className='text-muted-foreground/60 size-4' />
          <div className='text-sm font-semibold'>
            {t('User Consumption Trend')}
          </div>
        </div>
        <div className='h-[300px] p-1.5 sm:h-96 sm:p-2'>
          {topUsersQuery.isLoading ? (
            <Skeleton className='h-full w-full' />
          ) : (
            themeReady && (
              <VChart
                key={`platform-users-trend-${topUserLimit}-${resolvedTheme}-${customization.preset}`}
                spec={{
                  ...chartData.spec_user_trend,
                  theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                  background: 'transparent',
                }}
                option={VCHART_OPTION}
              />
            )
          )}
        </div>
      </div>
    </section>
  )
}