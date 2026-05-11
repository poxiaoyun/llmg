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
import type { ModelCapability, PricingModel, TokenUnit } from '../types'

export interface PricingColumnsOptions {
  tokenUnit?: TokenUnit
  priceRate?: number
  usdExchangeRate?: number
  showRechargePrice?: boolean
}

const CAPABILITY_LABEL_KEYS: Record<ModelCapability, string> = {
  function_calling: 'Function calling',
  streaming: 'Streaming',
  vision: 'Vision',
  json_mode: 'JSON mode',
  structured_output: 'Structured output',
  reasoning: 'Reasoning',
  tools: 'Tools',
  system_prompt: 'System prompt',
  web_search: 'Web search',
  code_interpreter: 'Code interpreter',
  caching: 'Prompt caching',
  embeddings: 'Embeddings',
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

function renderCapabilitiesCell(
  capabilities: ModelCapability[],
  t: (key: string) => string
) {
  if (capabilities.length === 0) {
    return renderUnavailableCell()
  }

  const visibleCapabilities = capabilities.slice(0, 3)
  const remaining = capabilities.length - visibleCapabilities.length

  return (
    <div className='flex max-w-[280px] flex-wrap gap-1'>
      {visibleCapabilities.map((capability) => (
        <span
          key={capability}
          className='bg-muted text-foreground rounded-md px-2 py-0.5 text-xs'
        >
          {t(CAPABILITY_LABEL_KEYS[capability] ?? capability)}
        </span>
      ))}
      {remaining > 0 && (
        <span className='text-muted-foreground px-1 text-xs'>+{remaining}</span>
      )}
    </div>
  )
}

function getPriceValue(args: {
  model: PricingModel
  type: 'input' | 'output' | 'cache'
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

    const fieldMap = {
      input: 'inputPrice',
      output: 'outputPrice',
      cache: 'cacheReadPrice',
    } as const
    const entry = dynamicSummary.entries.find(
      (item) => item.field === fieldMap[type]
    )

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

  if (type === 'cache' && model.cache_ratio == null) {
    return renderUnavailableCell()
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
      id: 'cache_price',
      meta: { label: t('Cache price') },
      header: t('Cache price'),
      cell: ({ row }) =>
        getPriceValue({
          model: row.original,
          type: 'cache',
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
      id: 'capabilities',
      meta: { label: t('Capabilities') },
      header: t('Capabilities'),
      cell: ({ row }) => {
        const metadata = inferModelMetadata(row.original)
        return renderCapabilitiesCell(metadata.capabilities, t)
      },
      size: 260,
      enableSorting: false,
    },
  ]
}
