import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()
  const isBrandWordmark = systemName.trim().toUpperCase() === 'LLMG'

  return (
    <div className='or-grid-bg bg-background relative grid h-svh max-w-none overflow-hidden'>
      <Link
        to='/'
        className='text-foreground hover:bg-muted absolute top-4 left-4 z-10 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors sm:top-6 sm:left-6'
      >
        {loading ? (
          <Skeleton className='h-8 w-8 rounded-xl' />
        ) : (
          <img
            src={logo}
            alt={t('Logo')}
            className='h-8 w-8 shrink-0 object-contain'
          />
        )}
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1
            className={cn(
              'text-xl font-semibold tracking-tight sm:text-2xl',
              isBrandWordmark && 'or-brand-wordmark text-[1.14rem] tracking-[0.14em] sm:text-[1.28rem]'
            )}
          >
            {systemName}
          </h1>
        )}
      </Link>
      <div className='container flex items-center pt-16 sm:pt-0'>
        <div className='or-surface mx-auto flex w-full flex-col justify-center space-y-2 px-5 py-6 sm:w-[440px] sm:p-8'>
          {children}
        </div>
      </div>
    </div>
  )
}
