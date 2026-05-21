import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
	downloadInvoiceFile,
	isApiSuccess,
	uploadInvoiceRequestFile,
	updateInvoiceRequest,
} from '@/features/wallet/api'
import { formatTimestamp } from '@/features/wallet/lib/billing'
import { getInvoiceStatusConfig } from '@/features/wallet/lib/invoice'
import { formatNumber } from '@/lib/format'
import type { InvoiceRequestRecord, InvoiceRequestStatus } from '@/features/wallet/types'

type InvoiceMaintenanceSheetProps = {
	open: boolean
	request: InvoiceRequestRecord | null
	onOpenChange: (open: boolean) => void
	onSaved?: () => Promise<void> | void
}

const STATUS_OPTIONS: InvoiceRequestStatus[] = ['pending', 'processing', 'issued', 'rejected']

export function InvoiceMaintenanceSheet({
	open,
	request,
	onOpenChange,
	onSaved,
}: InvoiceMaintenanceSheetProps) {
	const { t } = useTranslation()
	const [saving, setSaving] = useState(false)
	const [status, setStatus] = useState<InvoiceRequestStatus>('pending')
	const [invoiceRecord, setInvoiceRecord] = useState('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		if (!request) {
			return
		}
		setStatus(request.status)
		setInvoiceRecord(request.invoice_record || '')
		setSelectedFile(null)
	}, [request])

	const handleSave = async () => {
		if (!request) {
			return
		}

		try {
			setSaving(true)
			const response = await updateInvoiceRequest(request.id, {
				status,
				invoice_record: invoiceRecord,
			})
			if (!isApiSuccess(response)) {
				toast.error(response.message || t('Failed to update invoice request'))
				return
			}

			if (selectedFile) {
				const uploadResponse = await uploadInvoiceRequestFile(request.id, selectedFile)
				if (!isApiSuccess(uploadResponse)) {
					toast.error(uploadResponse.message || t('Status saved, but invoice file upload failed'))
					await onSaved?.()
					return
				}
			}

			toast.success(
				selectedFile
					? t('Invoice status and file updated successfully')
					: t('Invoice request updated successfully')
			)
			await onSaved?.()
			onOpenChange(false)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange} preventAutoDismiss>
			<SheetContent
				showCloseButton={false}
				className='flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl'
			>
				<SheetHeader className='border-b px-4 py-3 text-start sm:px-6 sm:py-4'>
					<SheetTitle>{t('Maintain Invoice')}</SheetTitle>
					<SheetDescription>
						{t('Update the invoice progress and keep a manual record for the user application.')}
					</SheetDescription>
				</SheetHeader>

				<div className='flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6'>
					<div className='grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2'>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('User')}</Label>
							<div className='text-sm font-medium'>
								{request?.display_name || request?.username || `#${request?.user_id ?? '-'}`}
							</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Billing Time')}</Label>
							<div className='text-sm'>
								{request ? formatTimestamp(request.order_time) : '-'}
							</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Order No.')}</Label>
							<div className='font-mono text-sm'>{request?.trade_no || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Order Amount')}</Label>
							<div className='text-sm'>{formatNumber(request?.order_amount)}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Company')}</Label>
							<div className='text-sm'>{request?.company || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Name')}</Label>
							<div className='text-sm'>{request?.name || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Region')}</Label>
							<div className='text-sm'>{request?.region || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Tax ID')}</Label>
							<div className='text-sm'>{request?.tax_id || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Email')}</Label>
							<div className='text-sm'>{request?.email || '-'}</div>
						</div>
						<div className='space-y-1 sm:col-span-2'>
							<Label className='text-muted-foreground text-xs'>{t('Payment Information')}</Label>
							<div className='text-sm leading-6 whitespace-pre-wrap'>
								{request?.payment_information || '-'}
							</div>
						</div>
						<div className='space-y-1 sm:col-span-2'>
							<Label className='text-muted-foreground text-xs'>{t('Billing Address')}</Label>
							<div className='text-sm leading-6 whitespace-pre-wrap'>
								{request?.billing_address || '-'}
							</div>
						</div>
					</div>

					<div className='space-y-2'>
						<Label>{t('Invoice Status')}</Label>
						<Select
							value={status}
							onValueChange={(value) => value !== null && setStatus(value as InvoiceRequestStatus)}
						>
							<SelectTrigger className='w-full'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent alignItemWithTrigger={false}>
								<SelectGroup>
									{STATUS_OPTIONS.map((item) => {
										const config = getInvoiceStatusConfig(item)
										return (
											<SelectItem key={item} value={item}>
												{t(config.label)}
											</SelectItem>
										)
									})}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='invoice-record'>{t('Invoice Record')}</Label>
						<Textarea
							id='invoice-record'
							value={invoiceRecord}
							onChange={(e) => setInvoiceRecord(e.target.value)}
							placeholder={t('Add invoice number, courier note, or internal record here')}
							rows={6}
						/>
					</div>

					<div className='space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4'>
						<div className='flex items-start justify-between gap-3'>
							<div className='space-y-1'>
								<Label className='text-muted-foreground text-xs'>{t('Invoice File')}</Label>
								<div className='text-sm font-medium'>
									{request?.invoice_file_name || t('No invoice file uploaded')}
								</div>
								{request?.invoice_file_size ? (
									<div className='text-muted-foreground text-xs'>
										{formatNumber(request.invoice_file_size / 1024)} KB
									</div>
								) : null}
							</div>
							{request?.invoice_file_name ? (
								<Button
									type='button'
									variant='outline'
									onClick={() =>
										void downloadInvoiceFile(
											request.id,
											'admin',
											request.invoice_file_name || `invoice-${request.id}`
										)
									}
								>
									{t('Download Invoice')}
								</Button>
							) : null}
						</div>

						<Input
							ref={fileInputRef}
							type='file'
							accept='application/pdf,image/png,image/jpeg,image/webp'
							className='hidden'
							onChange={(event) => {
								const file = event.target.files?.[0] || null
								setSelectedFile(file)
							}}
						/>

						<div className='flex flex-wrap items-center gap-3'>
							<Button
								type='button'
								variant='outline'
								onClick={() => fileInputRef.current?.click()}
							>
								{request?.invoice_file_name ? t('Replace invoice file') : t('Upload invoice file')}
							</Button>
							{selectedFile ? (
								<span className='text-muted-foreground text-xs'>
									{t('Selected file')}: {selectedFile.name}
								</span>
							) : null}
						</div>

						<p className='text-muted-foreground text-xs'>
							{t('PDF or image files up to 10 MB')}
						</p>
					</div>
				</div>

				<SheetFooter className='grid grid-cols-2 gap-2 border-t px-4 py-3 sm:flex sm:px-6 sm:py-4'>
					<SheetClose render={<Button variant='outline' disabled={saving} />}>
						{t('Cancel')}
					</SheetClose>
					<Button onClick={handleSave} disabled={saving}>
						{saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						{t('Save changes')}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}