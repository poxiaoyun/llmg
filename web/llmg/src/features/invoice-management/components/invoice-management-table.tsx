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
import { formatNumber } from '@/lib/format'
import { DataTablePage } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import {
	downloadInvoiceFile,
	getAllInvoiceRequests,
	isApiSuccess,
	previewInvoiceFile,
} from '@/features/wallet/api'
import { getInvoiceStatusConfig } from '@/features/wallet/lib/invoice'
import type { InvoiceRequestRecord } from '@/features/wallet/types'
import { InvoiceMaintenanceSheet } from './invoice-maintenance-sheet'

const route = getRouteApi('/_authenticated/invoice-management/')

export function InvoiceManagementTable() {
	const { t } = useTranslation()
	const isMobile = useMediaQuery('(max-width: 640px)')
	const [selectedRequest, setSelectedRequest] = useState<InvoiceRequestRecord | null>(null)

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

	const invoiceQuery = useQuery({
		queryKey: [
			'invoice-management',
			pagination.pageIndex + 1,
			pagination.pageSize,
			globalFilter,
		],
		queryFn: async () => {
			const response = await getAllInvoiceRequests(
				pagination.pageIndex + 1,
				pagination.pageSize,
				globalFilter
			)

			if (!isApiSuccess(response) || !response.data) {
				toast.error(response.message || t('Failed to load invoice requests'))
				return { items: [], total: 0 }
			}

			return {
				items: response.data.items || [],
				total: response.data.total || 0,
			}
		},
		placeholderData: (previousData) => previousData,
	})

	const requests = invoiceQuery.data?.items || []

	const columns = useMemo<ColumnDef<InvoiceRequestRecord>[]>(
		() => [
			{
				id: 'user',
				header: t('User'),
				cell: ({ row }) => (
					<div className='space-y-1'>
						<div className='font-medium'>
							{row.original.display_name || row.original.username || `#${row.original.user_id}`}
						</div>
						<div className='text-muted-foreground text-xs'>
							{row.original.username || row.original.user_email || `ID ${row.original.user_id}`}
						</div>
					</div>
				),
			},
			{
				accessorKey: 'company',
				header: t('Company'),
			},
			{
				accessorKey: 'order_time',
				header: t('Order Time'),
				cell: ({ row }) => new Date(row.original.order_time * 1000).toLocaleString(),
			},
			{
				accessorKey: 'order_amount',
				header: t('Order Amount'),
				cell: ({ row }) => formatNumber(row.original.order_amount),
			},
			{
				accessorKey: 'region',
				header: t('Region'),
				cell: ({ row }) => row.original.region || '-',
			},
			{
				accessorKey: 'tax_id',
				header: t('Tax ID'),
			},
			{
				accessorKey: 'status',
				header: t('Invoice Status'),
				cell: ({ row }) => {
					const config = getInvoiceStatusConfig(row.original.status)
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
				id: 'invoice_file',
				header: t('Invoice File'),
				cell: ({ row }) => {
					const request = row.original
					if (!request.invoice_file_name) {
						return <span className='text-muted-foreground text-sm'>-</span>
					}

					return (
						<div className='space-y-1'>
							<button
								type='button'
								className='text-primary block max-w-[220px] truncate text-left text-sm font-medium'
								onClick={() =>
									void downloadInvoiceFile(
										request.id,
										'admin',
										request.invoice_file_name || `invoice-${request.id}`
									)
								}
								title={request.invoice_file_name}
							>
								{request.invoice_file_name}
							</button>
							<div className='flex items-center gap-3 text-xs'>
								{request.invoice_file_size ? (
									<span className='text-muted-foreground'>
										{formatNumber(request.invoice_file_size / 1024)} KB
									</span>
								) : null}
								<button
									type='button'
									className='text-primary inline-flex items-center font-medium'
									onClick={() =>
										void previewInvoiceFile(
											request.id,
											'admin',
											request.invoice_file_name || `invoice-${request.id}`
										)
									}
								>
									{t('Preview')}
								</button>
							</div>
						</div>
					)
				},
			},
			{
				id: 'actions',
				header: t('Actions'),
				cell: ({ row }) => (
					<div className='flex justify-end'>
						<button
							type='button'
							className='text-primary inline-flex items-center text-sm font-medium'
							onClick={() => setSelectedRequest(row.original)}
						>
							{t('Maintain Invoice')}
						</button>
					</div>
				),
			},
		],
		[t]
	)

	const table = useReactTable({
		data: requests,
		columns,
		state: {
			columnFilters,
			globalFilter,
			pagination,
		},
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount: Math.ceil((invoiceQuery.data?.total || 0) / pagination.pageSize),
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
				isLoading={invoiceQuery.isLoading}
				isFetching={invoiceQuery.isFetching}
				emptyTitle={t('No Invoice Requests Found')}
				emptyDescription={t(
					'Invoice requests submitted by users will appear here for status maintenance.'
				)}
				toolbarProps={{
					searchPlaceholder: t('Search by order number, company, tax ID or user...'),
				}}
			/>

			<InvoiceMaintenanceSheet
				open={selectedRequest != null}
				request={selectedRequest}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedRequest(null)
					}
				}}
				onSaved={async () => {
					await invoiceQuery.refetch()
				}}
			/>
		</>
	)
}