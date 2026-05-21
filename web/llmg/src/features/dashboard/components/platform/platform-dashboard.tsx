import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Box, Clock3, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { computeTimeRange, getRollingDateRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { getPlatformUsageSummary } from '@/features/dashboard/api'
import { ConsumptionDistributionChart } from '@/features/dashboard/components/models/consumption-distribution-chart'
import { LogStatCards } from '@/features/dashboard/components/models/log-stat-cards'
import { ModelCharts } from '@/features/dashboard/components/models/model-charts'
import { PerformanceOverview } from '@/features/dashboard/components/models/performance-overview'
import { UptimePanel } from '@/features/dashboard/components/overview/uptime-panel'
import { PlatformTopUsers } from './platform-top-users'
import type {
  DashboardFilters,
  PlatformUsageSummary,
  QuotaDataItem,
} from '@/features/dashboard/types'

type PlatformRangePreset = {
  key: '24h' | '7d' | '30d'
  labelKey: string
  shortLabel: string
  days: number
  hours: number
  timeGranularity: 'hour' | 'day' | 'week'
}

const PLATFORM_RANGE_PRESETS: PlatformRangePreset[] = [
  {
    key: '24h',
    labelKey: 'Past 24 Hours',
    shortLabel: '24h',
    days: 1,
    hours: 24,
    timeGranularity: 'hour',
  },
  {
    key: '7d',
    labelKey: 'Past 7 Days',
    shortLabel: '7d',
    days: 7,
    hours: 24 * 7,
    timeGranularity: 'day',
  },
  {
    key: '30d',
    labelKey: 'Past 1 Month',
    shortLabel: '30d',
    days: 30,
    hours: 24 * 30,
    timeGranularity: 'week',
  },
]

function SummaryCard(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  loading?: boolean
  error?: boolean
}) {
  const Icon = props.icon

  return (
    <div className='px-3 py-2.5 sm:px-5 sm:py-4'>
      <div className='flex items-center gap-2'>
        <Icon className='text-muted-foreground/60 size-3.5 shrink-0' />
        <div className='text-muted-foreground truncate text-xs font-medium tracking-wider uppercase'>
          {props.label}
        </div>
      </div>
      {props.loading ? (
        <div className='mt-2 space-y-1.5'>
          <Skeleton className='h-7 w-16' />
          <Skeleton className='h-3.5 w-28' />
        </div>
      ) : (
        <>
          <div className='text-foreground mt-1.5 font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
            {props.error ? '--' : props.value}
          </div>
          <div className='text-muted-foreground/60 mt-1 hidden text-xs md:block'>
            {props.hint}
          </div>
        </>
      )}
    </div>
  )
}

export function PlatformDashboard() {
  const { t } = useTranslation()
  const [activePresetKey, setActivePresetKey] = useState<PlatformRangePreset['key']>('24h')
  const [modelData, setModelData] = useState<QuotaDataItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const activePreset =
    PLATFORM_RANGE_PRESETS.find((preset) => preset.key === activePresetKey) ??
    PLATFORM_RANGE_PRESETS[0]

  const dashboardFilters = useMemo<DashboardFilters>(() => {
    const { start, end } = getRollingDateRange(activePreset.days)
    return {
      start_timestamp: start,
      end_timestamp: end,
      time_granularity: activePreset.timeGranularity,
    }
  }, [activePreset.days, activePreset.timeGranularity])

  const timeRange = useMemo(
    () =>
      computeTimeRange(
        activePreset.days,
        dashboardFilters.start_timestamp,
        dashboardFilters.end_timestamp
      ),
    [
      activePreset.days,
      dashboardFilters.end_timestamp,
      dashboardFilters.start_timestamp,
    ]
  )

  const summaryQuery = useQuery({
    queryKey: [
      'dashboard-platform-summary',
      timeRange.start_timestamp,
      timeRange.end_timestamp,
    ],
    queryFn: () => getPlatformUsageSummary(timeRange),
    staleTime: 60 * 1000,
    retry: false,
  })

  const summary: PlatformUsageSummary | null = summaryQuery.data?.data ?? null
  const summaryLoading = summaryQuery.isLoading
  const summaryError = summaryQuery.isError
  const handleDataUpdate = useCallback(
    (data: QuotaDataItem[], loading: boolean) => {
      setModelData(data)
      setDataLoading(loading)
    },
    []
  )

  return (
    <section className='space-y-3 sm:space-y-4'>
      <div className='flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
        <div>
          <div className='text-sm font-semibold'>{t('Platform Analytics')}</div>
          <div className='text-muted-foreground text-xs'>
            {t('Platform-wide API usage summary for administrators')}
          </div>
        </div>
        <div className='bg-muted/60 inline-flex h-8 overflow-x-auto rounded-lg border p-0.5'>
          {PLATFORM_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type='button'
              onClick={() => setActivePresetKey(preset.key)}
              className={cn(
                'shrink-0 rounded-md px-3 text-xs font-medium transition-colors',
                activePreset.key === preset.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <div className='divide-border/60 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
          <SummaryCard
            icon={Activity}
            label={t('Online Users')}
            value={String(summary?.online_users ?? 0)}
            hint={t('Users logged in within {{minutes}} minutes', {
              minutes: summary?.online_window_minutes ?? 15,
            })}
            loading={summaryLoading}
            error={summaryError}
          />
          <SummaryCard
            icon={Users}
            label={t('Active Users')}
            value={String(summary?.active_users ?? 0)}
            hint={t('Users with API calls in {{window}}', {
              window: t(activePreset.labelKey),
            })}
            loading={summaryLoading}
            error={summaryError}
          />
          <SummaryCard
            icon={Box}
            label={t('Active Models')}
            value={String(summary?.distinct_models ?? 0)}
            hint={t('Distinct models called in {{window}}', {
              window: t(activePreset.labelKey),
            })}
            loading={summaryLoading}
            error={summaryError}
          />
        </div>
      </div>

      <LogStatCards
        filters={dashboardFilters}
        onDataUpdate={handleDataUpdate}
      />

      <PerformanceOverview
        hours={activePreset.hours}
        windowLabel={activePreset.shortLabel}
        windowDescription={t(activePreset.labelKey)}
      />

      <ConsumptionDistributionChart
        data={modelData}
        loading={dataLoading}
        timeGranularity={activePreset.timeGranularity}
      />

      <ModelCharts
        data={modelData}
        loading={dataLoading}
        timeGranularity={activePreset.timeGranularity}
      />

      <PlatformTopUsers
        timeRange={timeRange}
        timeGranularity={activePreset.timeGranularity}
      />

      <div className='grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-4'>
        <div className='overflow-hidden rounded-lg border'>
          <div className='flex items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3'>
            <Clock3 className='text-muted-foreground/60 size-4' />
            <div className='text-sm font-semibold'>
              {t('Platform usage window')}
            </div>
          </div>
          <div className='grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-3 sm:px-5 sm:py-4'>
            {PLATFORM_RANGE_PRESETS.map((preset) => (
              <div
                key={preset.key}
                className={cn(
                  'rounded-lg border px-3 py-3',
                  activePreset.key === preset.key &&
                    'border-primary/40 bg-primary/5'
                )}
              >
                <div className='text-sm font-semibold'>{t(preset.labelKey)}</div>
                <div className='text-muted-foreground mt-1 text-xs'>
                  {t('Compare total calls, tokens, model mix, latency, and supplier status in this window.')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <UptimePanel />
      </div>
    </section>
  )
}