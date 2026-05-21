import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
	type ColumnDef,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMediaQuery } from '@/hooks'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'
import { DataTablePage } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import {
	downloadInvoiceFile,
	getUserBillingHistory,
	isApiSuccess,
	lookupInvoiceRequests,
} from '@/features/wallet/api'
import { getStatusConfig, getPaymentMethodName, formatTimestamp } from '@/features/wallet/lib/billing'
import { getInvoiceStatusConfig } from '@/features/wallet/lib/invoice'
import type { InvoiceRequestRecord, TopupRecord } from '@/features/wallet/types'
import { InvoiceRequestSheet } from './invoice-request-sheet'

const route = getRouteApi('/_authenticated/orders/')

export function OrdersTable() {
	const { t } = useTranslation()
	const isMobile = useMediaQuery('(max-width: 640px)')
	const [selectedOrder, setSelectedOrder] = useState<TopupRecord | null>(null)

	const {
		globalFilter,
		onGlobalFilterChange,
		columnFilters,
		onColumnFiltersChange,
		pagination,
		onPaginationChange,
		ensurePageInRange,
	} = useTableUrlState({
		search: route.useSearch(),
		navigate: route.useNavigate(),
		pagination: { defaultPage: 1, defaultPageSize: isMobile ? 10 : 20 },
		globalFilter: { enabled: true, key: 'filter' },
	})

	const ordersQuery = useQuery({
		queryKey: [
			'orders',
			pagination.pageIndex + 1,
			pagination.pageSize,
			globalFilter,
		],
		queryFn: async () => {
			const response = await getUserBillingHistory(
				pagination.pageIndex + 1,
				pagination.pageSize,
				globalFilter
			)

			if (!isApiSuccess(response) || !response.data) {
				toast.error(response.message || t('Failed to load orders'))
				return { items: [], total: 0 }
			}

			return {
				items: response.data.items || [],
				total: response.data.total || 0,
			}
		},
		placeholderData: (previousData) => previousData,
	})

	const orders = ordersQuery.data?.items || []
	const topupIds = useMemo(() => orders.map((order) => order.id), [orders])

	const invoiceLookupQuery = useQuery({
		queryKey: ['order-invoice-lookup', topupIds],
		enabled: topupIds.length > 0,
		queryFn: async () => {
			const response = await lookupInvoiceRequests(topupIds)
			if (!isApiSuccess(response) || !response.data) {
				toast.error(response.message || t('Failed to load invoice requests'))
				return [] as InvoiceRequestRecord[]
			}
			return response.data.items || []
		},
		placeholderData: (previousData) => previousData ?? [],
	})

	const invoiceMap = useMemo(
		() =>
			new Map(
				(invoiceLookupQuery.data || []).map((request) => [request.topup_id, request])
			),
		[invoiceLookupQuery.data]
	)

	const columns = useMemo<ColumnDef<TopupRecord>[]>(
		() => [
			{
				accessorKey: 'trade_no',
				header: t('Order No.'),
				cell: ({ row }) => (
					<div className='max-w-[220px] truncate font-mono text-xs sm:text-sm'>
						{row.original.trade_no}
					</div>
				),
			},
			{
				id: 'order_time',
				header: t('Order Time'),
				cell: ({ row }) =>
					formatTimestamp(
						row.original.complete_time || row.original.create_time
					),
			},
			{
				accessorKey: 'payment_method',
				header: t('Payment Method'),
				cell: ({ row }) => t(getPaymentMethodName(row.original.payment_method)),
			},
			{
				accessorKey: 'money',
				header: t('Order Amount'),
				cell: ({ row }) => formatNumber(row.original.money),
			},
			{
				accessorKey: 'amount',
				header: t('Credited Quota'),
				cell: ({ row }) =>
					formatCurrencyFromUSD(row.original.amount, {
						digitsLarge: 2,
						digitsSmall: 2,
						abbreviate: false,
					}),
			},
			{
				accessorKey: 'status',
				header: t('Payment Status'),
				cell: ({ row }) => {
					const config = getStatusConfig(row.original.status)
					return (
						<StatusBadge
							label={t(config.label)}
							variant={config.variant}
							copyable={false}
							showDot
						/>
					)
				},
			},
			{
				id: 'invoice_status',
				header: t('Invoice Status'),
				cell: ({ row }) => {
					const config = getInvoiceStatusConfig(invoiceMap.get(row.original.id)?.status)
					return (
						<StatusBadge
							label={t(config.label)}
							variant={config.variant}
							copyable={false}
							showDot={config.variant !== 'neutral'}
						/>
					)
				},
			},
			{
				id: 'actions',
				header: t('Actions'),
				cell: ({ row }) => {
					const invoiceRequest = invoiceMap.get(row.original.id)
					const canDownload =
						invoiceRequest?.status === 'issued' && Boolean(invoiceRequest.invoice_file_name)
					const canApply =
						row.original.status === 'success' && invoiceRequest == null

					return (
						<div className='flex justify-end'>
							<button
								type='button'
								className='text-primary disabled:text-muted-foreground inline-flex items-center text-sm font-medium'
								onClick={() => {
									if (canDownload && invoiceRequest) {
										void downloadInvoiceFile(
											invoiceRequest.id,
											'user',
											invoiceRequest.invoice_file_name || `invoice-${invoiceRequest.id}`
										)
										return
									}
									setSelectedOrder(row.original)
								}}
								disabled={!canApply && !canDownload}
							>
								{canDownload ? t('Download Invoice') : invoiceRequest ? t('Applied') : t('Apply for Invoice')}
							</button>
						</div>
					)
				},
			},
		],
		[invoiceMap, t]
	)

	const table = useReactTable({
		data: orders,
		columns,
		state: {
			columnFilters,
			globalFilter,
			pagination,
		},
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((ordersQuery.data?.total || 0) / pagination.pageSize),
		onPaginationChange,
		onGlobalFilterChange,
		onColumnFiltersChange,
	})

	useEffect(() => {
		ensurePageInRange(table.getPageCount())
	}, [ensurePageInRange, table])

	return (
		<>
			<DataTablePage
				table={table}
				columns={columns}
				isLoading={ordersQuery.isLoading}
				isFetching={ordersQuery.isFetching || invoiceLookupQuery.isFetching}
				emptyTitle={t('No Orders Found')}
				emptyDescription={t(
					'No matching orders were found. Completed recharge orders will appear here.'
				)}
				toolbarProps={{
					searchPlaceholder: t('Search by order number...'),
				}}
			/>

			<InvoiceRequestSheet
				open={selectedOrder != null}
				order={selectedOrder}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedOrder(null)
					}
				}}
				onSubmitted={async () => {
					await Promise.all([
						ordersQuery.refetch(),
						invoiceLookupQuery.refetch(),
					])
				}}
			/>
		</>
	)
}