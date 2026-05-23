import type { ReactNode } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '@/components/copy-button'
import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { inferModelMetadata } from '../lib/model-metadata'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatPrice,
  formatRequestPrice,
  stripTrailingZeros,
} from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'

export interface PricingColumnsOptions {
  tokenUnit?: TokenUnit
  priceRate?: number
  usdExchangeRate?: number
  showRechargePrice?: boolean
}

function formatContextLength(value?: number): string {
  if (!value || !Number.isFinite(value)) return '—'

  if (value >= 1_000_000) {
    const formatted = value / 1_000_000
    return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1).replace(/\.0$/, '')}M`
  }

  if (value >= 1_000) {
    const formatted = value / 1_000
    return `${Number.isInteger(formatted) ? formatted : formatted.toFixed(1).replace(/\.0$/, '')}K`
  }

  return String(value)
}

function renderUnavailableCell(label: string = '—'): ReactNode {
  return <span className='text-muted-foreground/40 text-xs'>{label}</span>
}

function renderPriceCell(value: string, suffix: string) {
  return (
    <span className='font-mono text-sm tabular-nums'>
      {value}
      <span className='text-muted-foreground/70'>/ {suffix}</span>
    </span>
  )
}

function renderTieredPriceCell(
  items: Array<{ label?: string; value: string }>,
  suffix: string
) {
  if (items.length === 0) {
    return renderUnavailableCell()
  }

  if (items.length === 1 && !items[0].label) {
    return renderPriceCell(items[0].value, suffix)
  }

  return (
    <div className='space-y-1'>
      {items.map((item) => (
        <div key={`${item.label || 'price'}-${item.value}`} className='flex items-baseline gap-2'>
          {item.label ? (
            <span className='text-muted-foreground/70 min-w-6 text-[11px] font-medium uppercase'>
              {item.label}
            </span>
          ) : null}
          <span className='font-mono text-sm tabular-nums'>
            {item.value}
            <span className='text-muted-foreground/70'>/ {suffix}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function getPriceValue(args: {
  model: PricingModel
  type: 'input' | 'output' | 'cache_read' | 'cache_write'
  tokenUnit: TokenUnit
  tokenUnitLabel: string
  requestLabel: string
  showRechargePrice: boolean
  priceRate: number
  usdExchangeRate: number
}): ReactNode {
  const {
    model,
    type,
    tokenUnit,
    tokenUnitLabel,
    requestLabel,
    showRechargePrice,
    priceRate,
    usdExchangeRate,
  } = args

  const dynamicSummary = getDynamicPricingSummary(model, {
    tokenUnit,
    showRechargePrice,
    priceRate,
    usdExchangeRate,
    groupRatioMultiplier: getDynamicDisplayGroupRatio(model),
  })

  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      return renderUnavailableCell('Expr')
    }

    if (type === 'cache_write') {
      const writeEntries = dynamicSummary.entries.filter(
        (item) =>
          item.field === 'cacheCreatePrice' || item.field === 'cacheCreate1hPrice'
      )

      return renderTieredPriceCell(
        writeEntries.map((item) => ({
          label:
            writeEntries.length > 1
              ? item.field === 'cacheCreate1hPrice'
                ? '1h'
                : '5m'
              : undefined,
          value: stripTrailingZeros(item.formatted),
        })),
        `${tokenUnitLabel} tokens`
      )
    }

    const fieldMap = {
      input: 'inputPrice',
      output: 'outputPrice',
      cache_read: 'cacheReadPrice',
    } as const
    const entry = dynamicSummary.entries.find((item) => item.field === fieldMap[type])

    if (!entry) {
      return renderUnavailableCell()
    }

    return renderPriceCell(
      stripTrailingZeros(entry.formatted),
      `${tokenUnitLabel} tokens`
    )
  }

  if (!isTokenBasedModel(model)) {
    if (type !== 'input') {
      return renderUnavailableCell()
    }

    const requestPrice = stripTrailingZeros(
      formatRequestPrice(model, showRechargePrice, priceRate, usdExchangeRate)
    )

    if (requestPrice === '-') {
      return renderUnavailableCell()
    }

    return renderPriceCell(requestPrice, requestLabel)
  }

  if (type === 'cache_read') {
    if (model.cache_ratio == null) {
      return renderUnavailableCell()
    }

    const price = stripTrailingZeros(
      formatPrice(
        model,
        'cache',
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate
      )
    )

    if (price === '-' || price.toLowerCase() === 'nan') {
      return renderUnavailableCell()
    }

    return renderPriceCell(price, `${tokenUnitLabel} tokens`)
  }

  if (type === 'cache_write') {
    if (model.create_cache_ratio == null) {
      return renderUnavailableCell()
    }

    const price = stripTrailingZeros(
      formatPrice(
        model,
        'create_cache',
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate
      )
    )

    if (price === '-' || price.toLowerCase() === 'nan') {
      return renderUnavailableCell()
    }

    return renderPriceCell(price, `${tokenUnitLabel} tokens`)
  }

  const price = stripTrailingZeros(
    formatPrice(
      model,
      type,
      tokenUnit,
      showRechargePrice,
      priceRate,
      usdExchangeRate
    )
  )

  if (price === '-' || price.toLowerCase() === 'nan') {
    return renderUnavailableCell()
  }

  return renderPriceCell(price, `${tokenUnitLabel} tokens`)
}

export function usePricingColumns(
  options: PricingColumnsOptions = {}
): ColumnDef<PricingModel>[] {
  const { t } = useTranslation()
  const {
    tokenUnit = DEFAULT_TOKEN_UNIT,
    priceRate = 1,
    usdExchangeRate = 1,
    showRechargePrice = false,
  } = options

  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const requestLabel = t('request')

  return [
    {
      accessorKey: 'model_name',
      meta: { label: t('Model Name') },
      header: t('Model Name'),
      cell: ({ row }) => {
        const model = row.original

        return (
          <div className='flex min-w-[240px] items-center gap-2'>
            <span className='truncate font-mono text-sm font-medium'>
              {model.model_name}
            </span>
            <span
              className='shrink-0'
              onClick={(event) => event.stopPropagation()}
            >
              <CopyButton
                value={model.model_name}
                size='sm'
                variant='ghost'
                className='h-7 w-7 p-0'
                iconClassName='size-3.5'
                tooltip={t('Copy model name')}
                successTooltip={t('Copied!')}
                aria-label={t('Copy model name')}
              />
            </span>
          </div>
        )
      },
      minSize: 240,
      enableSorting: false,
    },
    {
      id: 'context_length',
      meta: { label: t('Context') },
      header: t('Context'),
      cell: ({ row }) => {
        const metadata = inferModelMetadata(row.original)

        return (
          <span className='font-mono text-sm tabular-nums'>
            {formatContextLength(metadata.context_length)}
          </span>
        )
      },
      size: 100,
      enableSorting: false,
    },
    {
      id: 'input_price',
      meta: { label: t('Input price') },
      header: t('Input price'),
      cell: ({ row }) =>
        getPriceValue({
          model: row.original,
          type: 'input',
          tokenUnit,
          tokenUnitLabel,
          requestLabel,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
        }),
      size: 160,
      enableSorting: false,
    },
    {
      id: 'output_price',
      meta: { label: t('Output price') },
      header: t('Output price'),
      cell: ({ row }) =>
        getPriceValue({
          model: row.original,
          type: 'output',
          tokenUnit,
          tokenUnitLabel,
          requestLabel,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
        }),
      size: 160,
      enableSorting: false,
    },
    {
      id: 'cache_read_price',
      meta: { label: t('Cache read price') },
      header: t('Cache read price'),
      cell: ({ row }) =>
        getPriceValue({
          model: row.original,
          type: 'cache_read',
          tokenUnit,
          tokenUnitLabel,
          requestLabel,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
        }),
      size: 160,
      enableSorting: false,
    },
    {
      id: 'cache_write_price',
      meta: { label: t('Cache write price') },
      header: t('Cache write price'),
      cell: ({ row }) =>
        getPriceValue({
          model: row.original,
          type: 'cache_write',
          tokenUnit,
          tokenUnitLabel,
          requestLabel,
          showRechargePrice,
          priceRate,
          usdExchangeRate,
        }),
      size: 190,
      enableSorting: false,
    },
  ]
}
