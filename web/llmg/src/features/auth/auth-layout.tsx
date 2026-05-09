import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='or-grid-bg bg-background relative grid h-svh max-w-none overflow-hidden'>
      <Link
        to='/'
        className='text-foreground hover:bg-muted absolute top-4 left-4 z-10 flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors sm:top-6 sm:left-6'
      >
        <div className='bg-primary/10 ring-primary/20 relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md ring-1'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-md' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-5 w-5 rounded-sm object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-sm font-semibold tracking-tight'>{systemName}</h1>
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
