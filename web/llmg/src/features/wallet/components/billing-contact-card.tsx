import { useEffect, useState } from 'react'
import {
  Building2,
  CreditCard,
  Globe2,
  Mail,
  MapPin,
  Save,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { TitledCard } from '@/components/ui/titled-card'
import {
  BILLING_COUNTRY_GROUPS,
  findBillingCountryOption,
} from '../lib/billing-countries'
import type { BillingContact } from '../types'

interface BillingContactCardProps {
  contact?: BillingContact
  fallbackEmail?: string
  loading?: boolean
  saving?: boolean
  onSave: (contact: BillingContact) => Promise<boolean>
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

function buildDraft(
  contact?: BillingContact,
  fallbackEmail?: string
): BillingContact {
  return {
    ...EMPTY_CONTACT,
    ...contact,
    email: contact?.email || fallbackEmail || '',
  }
}

function normalizeContact(contact: BillingContact): BillingContact {
  return {
    company: contact.company.trim(),
    name: contact.name.trim(),
    country: contact.country.trim(),
    payment_information: contact.payment_information.trim(),
    email: contact.email.trim(),
    billing_address: contact.billing_address.trim(),
    tax_id: contact.tax_id.trim(),
  }
}

function hasContactValue(contact: BillingContact): boolean {
  return Object.values(contact).some((value) => value.trim().length > 0)
}

function formatCountryDisplay(country: string): string {
  const option = findBillingCountryOption(country)
  if (!option) {
    return country
  }
  return `${option.emoji} ${option.label}`
}

export function BillingContactCard({
  contact,
  fallbackEmail,
  loading,
  saving,
  onSave,
}: BillingContactCardProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<BillingContact>(() =>
    buildDraft(contact, fallbackEmail)
  )

  useEffect(() => {
    setDraft(buildDraft(contact, fallbackEmail))
  }, [contact, fallbackEmail])

  const displayContact = buildDraft(contact, fallbackEmail)
  const hasSavedContact = hasContactValue(displayContact)
  const selectedCountry = findBillingCountryOption(draft.country)
  const hasCustomCountryValue = Boolean(draft.country && !selectedCountry)

  const handleChange = (key: keyof BillingContact, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleCancel = () => {
    setDraft(buildDraft(contact, fallbackEmail))
    setEditing(false)
  }

  const handleSave = async () => {
    const success = await onSave(normalizeContact(draft))
    if (success) {
      setEditing(false)
    }
  }

  if (loading) {
    return (
      <TitledCard
        title={<Skeleton className='h-6 w-36' />}
        description={<Skeleton className='mt-2 h-4 w-56' />}
        icon={<Building2 className='h-4 w-4 opacity-0' />}
        action={<Skeleton className='h-9 w-20' />}
        className='h-full border-border/80 bg-gradient-to-br from-background to-muted/25'
        contentClassName='grid flex-1 gap-5 md:grid-cols-2'
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={cn(index >= 4 && 'md:col-span-2')}>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='mt-2 h-6 w-full' />
          </div>
        ))}
      </TitledCard>
    )
  }

  const fields = [
    {
      key: 'company' as const,
      label: t('Company'),
      value: displayContact.company,
      icon: Building2,
    },
    {
      key: 'name' as const,
      label: t('Name'),
      value: displayContact.name,
      icon: UserRound,
    },
    {
      key: 'country' as const,
      label: t('Country'),
      value: formatCountryDisplay(displayContact.country),
      icon: Globe2,
    },
    {
      key: 'email' as const,
      label: t('Email'),
      value: displayContact.email,
      icon: Mail,
    },
    {
      key: 'payment_information' as const,
      label: t('Payment Information'),
      value: displayContact.payment_information,
      icon: CreditCard,
      fullWidth: true,
    },
    {
      key: 'billing_address' as const,
      label: t('Billing Address'),
      value: displayContact.billing_address,
      icon: MapPin,
      fullWidth: true,
    },
    {
      key: 'tax_id' as const,
      label: t('Tax ID'),
      value: displayContact.tax_id,
      icon: CreditCard,
    },
  ]

  return (
    <TitledCard
      title={t('Billing Contact')}
      icon={<Building2 className='h-4 w-4' />}
      action={
        editing ? (
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCancel}
              disabled={saving}
            >
              {t('Cancel')}
            </Button>
            <Button size='sm' onClick={handleSave} disabled={saving}>
              <Save className='mr-1.5 h-4 w-4' />
              {t('Save')}
            </Button>
          </div>
        ) : (
          <Button variant='outline' size='sm' onClick={() => setEditing(true)}>
            {t('Edit')}
          </Button>
        )
      }
      className='h-full border-border/80 bg-gradient-to-br from-background to-muted/25'
      contentClassName='flex flex-1 flex-col space-y-5'
    >
      {editing ? (
        <div className='grid flex-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='billing-company'>{t('Company')}</Label>
            <Input
              id='billing-company'
              value={draft.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder={t('Legal entity or team name')}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='billing-name'>{t('Name')}</Label>
            <Input
              id='billing-name'
              value={draft.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('Primary billing contact')}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='billing-country'>{t('Country')}</Label>
            <Select
              value={draft.country || null}
              onValueChange={(value) =>
                value !== null &&
                handleChange(
                  'country',
                  value === '__empty__' ? '' : value
                )
              }
            >
              <SelectTrigger id='billing-country' className='h-10 w-full'>
                <SelectValue>
                  {selectedCountry
                    ? `${selectedCountry.emoji} ${selectedCountry.label}`
                    : draft.country || t('Select country or region')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align='start' alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value='__empty__'>
                    {t('No country selected')}
                  </SelectItem>
                </SelectGroup>

                {hasCustomCountryValue && (
                  <SelectGroup>
                    <SelectLabel>{t('Current saved value')}</SelectLabel>
                    <SelectItem value={draft.country}>{draft.country}</SelectItem>
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
            <Label htmlFor='billing-email'>{t('Email')}</Label>
            <Input
              id='billing-email'
              type='email'
              value={draft.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('Billing email for invoices')}
            />
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='billing-payment-information'>
              {t('Payment Information')}
            </Label>
            <Textarea
              id='billing-payment-information'
              value={draft.payment_information}
              onChange={(e) =>
                handleChange('payment_information', e.target.value)
              }
              placeholder={t('Optional payment note, entity details, or PO number')}
              rows={3}
            />
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='billing-address'>{t('Billing Address')}</Label>
            <Textarea
              id='billing-address'
              value={draft.billing_address}
              onChange={(e) => handleChange('billing_address', e.target.value)}
              placeholder={t('Street, city, state, postal code')}
              rows={4}
            />
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='billing-tax-id'>{t('Tax ID')}</Label>
            <Input
              id='billing-tax-id'
              value={draft.tax_id}
              onChange={(e) => handleChange('tax_id', e.target.value)}
              placeholder={t('VAT, GST, or company tax number')}
            />
          </div>
        </div>
      ) : (
        <div className='flex flex-1 flex-col gap-5'>
          {!hasSavedContact && (
            <div className='bg-muted/35 rounded-xl border px-3 py-2.5 text-sm text-muted-foreground'>
              {t('Add your billing identity once and reuse it for future orders and invoice requests.')}
            </div>
          )}

          <div className='grid gap-5 md:grid-cols-2'>
            {fields.map((field) => (
              <div
                key={field.key}
                className={cn('space-y-1.5', field.fullWidth && 'md:col-span-2')}
              >
                <div className='text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-[0.22em] uppercase'>
                  <field.icon className='h-3.5 w-3.5' />
                  {field.label}
                </div>
                <div className='min-h-6 text-sm font-medium leading-6 whitespace-pre-wrap'>
                  {field.value || '--'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </TitledCard>
  )
}