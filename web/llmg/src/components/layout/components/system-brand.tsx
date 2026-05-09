import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { normalizeSystemName } from '@/lib/constants'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': stacked card style (used inside the sidebar header).
   * - 'inline': compact horizontal pill (used inside the top app bar).
   */
  variant?: 'sidebar' | 'inline'
}

/**
 * System brand component
 * Displays current system logo + name.
 * - inline: compact pill in the top app bar; clicking navigates to home (/)
 * - sidebar: stacked card in the sidebar header (display only)
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { logo } = useSystemConfig()

  const variant = props.variant ?? 'sidebar'
  const name = normalizeSystemName(status?.system_name || props.defaultName)
  const isBrandWordmark = name.trim().toUpperCase() === 'LLMG'
  const version =
    status?.version || props.defaultVersion || t('Unknown version')

  if (variant === 'inline') {
    return (
      <Link
        to='/'
        aria-label={t('Go to home')}
        className={cn(
          'text-foreground inline-flex h-10 items-center gap-3 rounded-lg px-2 text-base font-semibold tracking-tight transition-colors outline-none select-none md:h-11 md:text-lg',
          'hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2'
        )}
      >
        <img
          src={logo}
          alt={t('Logo')}
          className='size-6 shrink-0 object-contain md:size-7'
        />
        <span
          className={cn(
            'max-w-[14rem] truncate text-[1.02rem] md:text-[1.08rem]',
            isBrandWordmark && 'or-brand-wordmark text-[1.02rem] tracking-[0.12em] md:text-[1.14rem]'
          )}
        >
          {name}
        </span>
      </Link>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:text-sidebar-foreground active:text-sidebar-foreground cursor-default hover:bg-transparent active:bg-transparent'
          render={<div />}
        >
          <div className='bg-sidebar-primary/10 ring-sidebar-primary/25 flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md ring-1'>
            <img
              src={logo}
              alt={t('Logo')}
              className='size-5 rounded-sm object-cover'
            />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden'>
            <span className='truncate font-semibold'>{name}</span>
            <span className='truncate text-xs'>{version}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
