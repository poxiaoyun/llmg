import { useNavigate, useRouter } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { history } = useRouter()

  return (
    <div
      className={cn(
        'relative min-h-svh w-full overflow-hidden bg-background',
        className
      )}
    >
      {!minimal && (
        <>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_32%)]' />
          <div className='absolute inset-0 bg-[linear-gradient(180deg,_transparent_0%,_rgba(15,23,42,0.04)_100%)]' />
        </>
      )}

      <div className='relative flex min-h-svh items-center justify-center p-6 sm:p-10'>
        <div className={cn('w-full max-w-2xl', minimal && 'max-w-lg')}>
          <div
            className={cn(
              'overflow-hidden rounded-3xl border border-border/60 bg-background/88 shadow-lg shadow-black/5 backdrop-blur',
              minimal &&
                'border-none bg-transparent shadow-none backdrop-blur-0'
            )}
          >
            {!minimal && (
              <div className='h-1 w-full bg-[linear-gradient(90deg,_#fb7185_0%,_#f59e0b_45%,_#38bdf8_100%)]' />
            )}

            <div
              className={cn(
                'flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10',
                minimal && 'px-0 py-0'
              )}
            >
              {!minimal && (
                <div className='bg-destructive/10 text-destructive border-destructive/30 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'>
                  <AlertTriangle className='size-3.5' aria-hidden='true' />
                  <span>{t('Internal Server Error!')}</span>
                </div>
              )}

              <div className='space-y-3'>
                <h1
                  className={cn(
                    'leading-none font-bold tracking-tight',
                    minimal ? 'text-5xl' : 'text-6xl sm:text-[7rem]'
                  )}
                >
                  500
                </h1>

                <div className='space-y-2'>
                  <p className='text-lg font-medium'>
                    {t('Oops! Something went wrong')} {`:')`}
                  </p>
                  <p className='text-muted-foreground mx-auto max-w-xl text-sm leading-6 sm:text-base'>
                    {t('We apologize for the inconvenience.')} {' '}
                    {t('Please try again later.')}
                  </p>
                </div>
              </div>

              {!minimal && (
                <div className='flex flex-wrap items-center justify-center gap-3 pt-2'>
                  <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => history.go(-1)}
                  >
                    <ArrowLeft className='size-4' aria-hidden='true' />
                    {t('Go Back')}
                  </Button>
                  <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className='size-4' aria-hidden='true' />
                    {t('Refresh')}
                  </Button>
                  <Button className='gap-2' onClick={() => navigate({ to: '/' })}>
                    <Home className='size-4' aria-hidden='true' />
                    {t('Back to Home')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
