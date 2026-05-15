import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import {
  LoadingSkeleton,
  EmptyState,
  PricingTable,
  PricingSidebar,
} from './components'
import { EXCLUDED_GROUPS, VIEW_MODES } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'

export function Pricing() {
  const { t } = useTranslation()
  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const {
    vendorFilter,
    endpointTypeFilter,
    tokenUnit,
    showRechargePrice,
    setVendorFilter,
    setEndpointTypeFilter,
    filteredModels,
    hasActiveFilters,
    clearFilters,
  } = useFilters(models || [])

  const availableGroups = useMemo(
    () =>
      Object.keys(usableGroup || {}).filter(
        (g) => !EXCLUDED_GROUPS.includes(g)
      ),
    [usableGroup]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
  }, [clearFilters])

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery=''
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    return (
      <PricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
      />
    )
  }

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='or-grid-bg mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <LoadingSkeleton viewMode={VIEW_MODES.TABLE} />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='or-grid-bg relative min-h-svh'>
        <PageTransition className='relative mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
          <div className='grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]'>
            <PricingSidebar
              quotaTypeFilter='all'
              endpointTypeFilter={endpointTypeFilter}
              vendorFilter={vendorFilter}
              groupFilter='all'
              tagFilter='all'
              onQuotaTypeChange={() => {}}
              onEndpointTypeChange={setEndpointTypeFilter}
              onVendorChange={setVendorFilter}
              onGroupChange={() => {}}
              onTagChange={() => {}}
              vendors={vendors || []}
              groups={availableGroups}
              groupRatios={groupRatio}
              tags={[]}
              models={models || []}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              className='hover-scrollbar sticky top-4 max-h-[calc(100dvh-2rem)] self-start overflow-y-auto'
            />

            <main className='min-w-0 space-y-3'>
              <div className='text-muted-foreground/80 rounded-lg border border-dashed px-3 py-2 text-xs leading-relaxed'>
                {t(
                  "List prices use each model's lowest available group ratio. See the model details page for base price and per-group pricing."
                )}
              </div>
              {renderPricingContent()}
            </main>
          </div>
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
