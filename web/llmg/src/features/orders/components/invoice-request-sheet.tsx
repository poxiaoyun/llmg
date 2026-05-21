import { useEffect, useMemo, useState } from 'react'
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
	SelectLabel,
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
import { createInvoiceRequest, isApiSuccess } from '@/features/wallet/api'
import { BILLING_COUNTRY_GROUPS, findBillingCountryOption } from '@/features/wallet/lib/billing-countries'
import { formatTimestamp, getPaymentMethodName } from '@/features/wallet/lib/billing'
import { formatNumber } from '@/lib/format'
import type { BillingContact, CreateInvoiceRequestPayload, TopupRecord } from '@/features/wallet/types'

type InvoiceRequestSheetProps = {
	open: boolean
	order: TopupRecord | null
	onOpenChange: (open: boolean) => void
	onSubmitted?: () => Promise<void> | void
}

const EMPTY_CONTACT: BillingContact = {
	company: '',
	name: '',
	country: '',
	payment_information: '',
	email: '',
	billing_address: '',
	tax_id: '',
}

function parseBillingContact(snapshot?: string): BillingContact {
	if (!snapshot) {
		return EMPTY_CONTACT
	}

	try {
		return {
			...EMPTY_CONTACT,
			...(JSON.parse(snapshot) as Partial<BillingContact>),
		}
	} catch {
		return EMPTY_CONTACT
	}
}

function buildDraft(order: TopupRecord | null): CreateInvoiceRequestPayload {
	const contact = parseBillingContact(order?.billing_contact_snapshot)
	return {
		topup_id: order?.id || 0,
		company: contact.company,
		name: contact.name,
		region: contact.country,
		payment_information: contact.payment_information,
		email: contact.email,
		tax_id: contact.tax_id,
		billing_address: contact.billing_address,
	}
}

export function InvoiceRequestSheet({
	open,
	order,
	onOpenChange,
	onSubmitted,
}: InvoiceRequestSheetProps) {
	const { t } = useTranslation()
	const [saving, setSaving] = useState(false)
	const [draft, setDraft] = useState<CreateInvoiceRequestPayload>(() =>
		buildDraft(order)
	)

	useEffect(() => {
		if (open) {
			setDraft(buildDraft(order))
		}
	}, [open, order])

	const selectedCountry = useMemo(
		() => findBillingCountryOption(draft.region),
		[draft.region]
	)
	const hasCustomCountryValue = Boolean(draft.region && !selectedCountry)

	const handleChange = (
		key: keyof CreateInvoiceRequestPayload,
		value: string | number
	) => {
		setDraft((prev) => ({
			...prev,
			[key]: value,
		}))
	}

	const canSubmit = Boolean(
		order &&
			draft.company.trim() &&
			draft.name.trim() &&
			draft.tax_id.trim() &&
			draft.billing_address.trim()
	)

	const handleSubmit = async () => {
		if (!order) {
			return
		}

		try {
			setSaving(true)
			const response = await createInvoiceRequest({
				...draft,
				topup_id: order.id,
			})

			if (!isApiSuccess(response)) {
				toast.error(response.message || t('Failed to submit invoice request'))
				return
			}

			toast.success(t('Invoice request submitted successfully'))
			await onSubmitted?.()
			onOpenChange(false)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange} preventAutoDismiss>
			<SheetContent
				showCloseButton={false}
				className='flex h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'
			>
				<SheetHeader className='border-b px-4 py-3 text-start sm:px-6 sm:py-4'>
					<SheetTitle>{t('Apply for Invoice')}</SheetTitle>
					<SheetDescription>
						{t('Review the auto-filled billing details and submit the invoice request for this paid order.')}
					</SheetDescription>
				</SheetHeader>

				<div className='flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6'>
					<div className='grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2'>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Order No.')}</Label>
							<div className='font-mono text-sm'>{order?.trade_no || '-'}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Billing Time')}</Label>
							<div className='text-sm'>
								{order
									? formatTimestamp(order.complete_time || order.create_time)
									: '-'}
							</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Order Amount')}</Label>
							<div className='text-sm'>{formatNumber(order?.money)}</div>
						</div>
						<div className='space-y-1'>
							<Label className='text-muted-foreground text-xs'>{t('Payment Method')}</Label>
							<div className='text-sm'>
								{order?.payment_method ? t(getPaymentMethodName(order.payment_method)) : '-'}
							</div>
						</div>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='invoice-company'>{t('Company')}</Label>
							<Input
								id='invoice-company'
								value={draft.company}
								onChange={(e) => handleChange('company', e.target.value)}
								placeholder={t('Legal entity or team name')}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='invoice-name'>{t('Name')}</Label>
							<Input
								id='invoice-name'
								value={draft.name}
								onChange={(e) => handleChange('name', e.target.value)}
								placeholder={t('Primary billing contact')}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='invoice-region'>{t('Region')}</Label>
							<Select
								value={draft.region || null}
								onValueChange={(value) =>
									value !== null && handleChange('region', value === '__empty__' ? '' : value)
								}
							>
								<SelectTrigger id='invoice-region' className='h-10 w-full'>
									<SelectValue>
										{selectedCountry
											? `${selectedCountry.emoji} ${selectedCountry.label}`
											: draft.region || t('Select country or region')}
									</SelectValue>
								</SelectTrigger>
								<SelectContent align='start' alignItemWithTrigger={false}>
									<SelectGroup>
										<SelectItem value='__empty__'>{t('No country selected')}</SelectItem>
									</SelectGroup>

									{hasCustomCountryValue && (
										<SelectGroup>
											<SelectLabel>{t('Current saved value')}</SelectLabel>
											<SelectItem value={draft.region}>{draft.region}</SelectItem>
										</SelectGroup>
									)}

									{BILLING_COUNTRY_GROUPS.map((group) => (
										<SelectGroup key={group.key}>
											<SelectLabel>{t(group.label)}</SelectLabel>
											{group.options.map((option) => (
												<SelectItem key={option.code} value={option.label}>
													<span>{option.emoji}</span>
													<span>{option.label}</span>
												</SelectItem>
											))}
										</SelectGroup>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='invoice-tax-id'>{t('Tax ID')}</Label>
							<Input
								id='invoice-tax-id'
								value={draft.tax_id}
								onChange={(e) => handleChange('tax_id', e.target.value)}
								placeholder={t('VAT, GST, or company tax number')}
							/>
						</div>

						<div className='space-y-2 md:col-span-2'>
							<Label htmlFor='invoice-payment-information'>
								{t('Payment Information')}
							</Label>
							<Textarea
								id='invoice-payment-information'
								value={draft.payment_information}
								onChange={(e) => handleChange('payment_information', e.target.value)}
								placeholder={t('Optional payment note, entity details, or PO number')}
								rows={3}
							/>
						</div>

						<div className='space-y-2 md:col-span-2'>
							<Label htmlFor='invoice-billing-address'>{t('Billing Address')}</Label>
							<Textarea
								id='invoice-billing-address'
								value={draft.billing_address}
								onChange={(e) => handleChange('billing_address', e.target.value)}
								placeholder={t('Street, city, state, postal code')}
								rows={3}
							/>
						</div>

						<div className='space-y-2 md:col-span-2'>
							<Label htmlFor='invoice-email'>{t('Email')}</Label>
							<Input
								id='invoice-email'
								type='email'
								value={draft.email}
								onChange={(e) => handleChange('email', e.target.value)}
								placeholder={t('Billing email for invoices')}
							/>
						</div>
					</div>
				</div>

				<SheetFooter className='grid grid-cols-2 gap-2 border-t px-4 py-3 sm:flex sm:px-6 sm:py-4'>
					<SheetClose render={<Button variant='outline' disabled={saving} />}>
						{t('Cancel')}
					</SheetClose>
					<Button onClick={handleSubmit} disabled={!canSubmit || saving}>
						{saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						{t('Submit Invoice Request')}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}