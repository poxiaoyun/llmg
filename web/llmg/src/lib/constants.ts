/**
 * Application-wide constants
 */

// System Configuration Defaults
export const DEFAULT_SYSTEM_NAME = 'LLMG'
export const DEFAULT_LOGO = '/logo.svg'
export const DEFAULT_FAVICON = '/favicon.ico?v=2'
export const DEFAULT_TITLE_SUFFIX = 'The Infinite In One.'
export function formatDocumentTitle(name?: string | null): string {
  return `${normalizeSystemName(name)} — ${DEFAULT_TITLE_SUFFIX}`
}

export function normalizeSystemName(name?: string | null): string {
  const trimmed = name?.trim()
  if (!trimmed || trimmed === 'New API' || trimmed === 'NewAPI') {
    return DEFAULT_SYSTEM_NAME
  }
  return trimmed
}

// LocalStorage Keys
export const STORAGE_KEYS = {
  SYSTEM_NAME: 'system_name',
  LOGO: 'logo',
  FOOTER_HTML: 'footer_html',
} as const
