export interface BillingCountryOption {
  code: string
  label: string
  emoji: string
  aliases?: string[]
}

export interface BillingCountryGroup {
  key: string
  label: string
  options: BillingCountryOption[]
}

export const BILLING_COUNTRY_GROUPS: BillingCountryGroup[] = [
  {
    key: 'asia',
    label: 'Asia',
    options: [
      { code: 'CN', label: 'China', emoji: '🇨🇳' },
      {
        code: 'HK',
        label: 'Hong Kong (China)',
        emoji: '🇭🇰',
        aliases: ['Hong Kong', 'Hong Kong SAR'],
      },
      {
        code: 'TW',
        label: 'Taiwan',
        emoji: '🇹🇼',
        aliases: ['Taiwan (China)', 'Chinese Taipei'],
      },
      { code: 'JP', label: 'Japan', emoji: '🇯🇵' },
      { code: 'KR', label: 'South Korea', emoji: '🇰🇷' },
      { code: 'SG', label: 'Singapore', emoji: '🇸🇬' },
      { code: 'IN', label: 'India', emoji: '🇮🇳' },
      { code: 'ID', label: 'Indonesia', emoji: '🇮🇩' },
      { code: 'MY', label: 'Malaysia', emoji: '🇲🇾' },
      { code: 'TH', label: 'Thailand', emoji: '🇹🇭' },
      { code: 'VN', label: 'Vietnam', emoji: '🇻🇳' },
      { code: 'PH', label: 'Philippines', emoji: '🇵🇭' },
      { code: 'AE', label: 'United Arab Emirates', emoji: '🇦🇪' },
      { code: 'SA', label: 'Saudi Arabia', emoji: '🇸🇦' },
    ],
  },
  {
    key: 'europe',
    label: 'Europe',
    options: [
      { code: 'GB', label: 'United Kingdom', emoji: '🇬🇧' },
      { code: 'IE', label: 'Ireland', emoji: '🇮🇪' },
      { code: 'DE', label: 'Germany', emoji: '🇩🇪' },
      { code: 'FR', label: 'France', emoji: '🇫🇷' },
      { code: 'NL', label: 'Netherlands', emoji: '🇳🇱' },
      { code: 'ES', label: 'Spain', emoji: '🇪🇸' },
      { code: 'IT', label: 'Italy', emoji: '🇮🇹' },
      { code: 'CH', label: 'Switzerland', emoji: '🇨🇭' },
      { code: 'SE', label: 'Sweden', emoji: '🇸🇪' },
      { code: 'PL', label: 'Poland', emoji: '🇵🇱' },
    ],
  },
  {
    key: 'north-america',
    label: 'North America',
    options: [
      { code: 'US', label: 'United States', emoji: '🇺🇸' },
      { code: 'CA', label: 'Canada', emoji: '🇨🇦' },
      { code: 'MX', label: 'Mexico', emoji: '🇲🇽' },
    ],
  },
  {
    key: 'south-america',
    label: 'South America',
    options: [
      { code: 'BR', label: 'Brazil', emoji: '🇧🇷' },
      { code: 'AR', label: 'Argentina', emoji: '🇦🇷' },
      { code: 'CL', label: 'Chile', emoji: '🇨🇱' },
      { code: 'CO', label: 'Colombia', emoji: '🇨🇴' },
      { code: 'PE', label: 'Peru', emoji: '🇵🇪' },
    ],
  },
  {
    key: 'oceania',
    label: 'Oceania',
    options: [
      { code: 'AU', label: 'Australia', emoji: '🇦🇺' },
      { code: 'NZ', label: 'New Zealand', emoji: '🇳🇿' },
    ],
  },
  {
    key: 'africa',
    label: 'Africa',
    options: [
      { code: 'ZA', label: 'South Africa', emoji: '🇿🇦' },
      { code: 'EG', label: 'Egypt', emoji: '🇪🇬' },
      { code: 'KE', label: 'Kenya', emoji: '🇰🇪' },
      { code: 'NG', label: 'Nigeria', emoji: '🇳🇬' },
      { code: 'MA', label: 'Morocco', emoji: '🇲🇦' },
    ],
  },
]

const BILLING_COUNTRY_OPTIONS = BILLING_COUNTRY_GROUPS.flatMap(
  (group) => group.options
)

export function findBillingCountryOption(
  value?: string | null
): BillingCountryOption | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return BILLING_COUNTRY_OPTIONS.find((option) => {
    const label = option.label.toLowerCase()
    const code = option.code.toLowerCase()
    const display = `${option.emoji} ${option.label}`.toLowerCase()
    const aliases = option.aliases?.map((alias) => alias.toLowerCase()) || []
    return (
      normalized === label ||
      normalized === code ||
      normalized === display ||
      aliases.includes(normalized)
    )
  })
}