import { Link } from '@tanstack/react-router'
import { ArrowRight, Flame, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  useSystemConfig()
  const modelRows = [
    {
      popularity: 3,
      model: 'gpt-5.5',
      provider: 'OpenAI',
      context: '1M',
    },
    {
      popularity: 2,
      model: 'claude-opus-4-7',
      provider: 'Anthropic',
      context: '1M',
    },
    {
      popularity: 1,
      model: 'gemini-3.1-pro-preview',
      provider: 'Google',
      context: '1M',
    },
  ]

  return (
    <section className='or-grid-bg relative z-10 overflow-hidden border-b px-4 pt-28 pb-12 md:pt-32 md:pb-16'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-10'>
        <div className='mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]'>
          <div className='flex max-w-3xl flex-col items-start'>
            <h1
              className='landing-animate-fade-up text-[clamp(2.25rem,7vw,4.75rem)] leading-[0.98] font-semibold tracking-tight text-balance'
              style={{ animationDelay: '0ms' }}
            >
              {t('The Infinite In One.')}
            </h1>
            <p
              className='landing-animate-fade-up text-muted-foreground mt-5 max-w-xl text-base leading-relaxed opacity-0 md:text-lg'
              style={{ animationDelay: '80ms' }}
            >
              {t('One layer between you and every AI.')}
            </p>
            <div
              className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0'
              style={{ animationDelay: '160ms' }}
            >
              {props.isAuthenticated ? (
                <Button
                  className='group rounded-lg'
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
              ) : (
                <>
                  <Button
                    className='group rounded-lg'
                    render={<Link to='/sign-up' />}
                  >
                    {t('Start building')}
                    <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                  </Button>
                  <Button
                    variant='outline'
                    className='border-border/50 hover:border-border hover:bg-muted/50 rounded-lg'
                    render={<Link to='/pricing' />}
                  >
                    {t('Explore models')}
                  </Button>
                </>
              )}
            </div>
            <div className='text-muted-foreground mt-8 flex flex-wrap items-center gap-4 font-mono text-xs'>
              <span>{t('OpenAI compatible')}</span>
              <span className='text-border'>/</span>
              <span>{t('40+ providers')}</span>
              <span className='text-border'>/</span>
              <span>{t('Usage analytics')}</span>
            </div>
          </div>

          <div
            className='landing-animate-fade-up opacity-0'
            style={{ animationDelay: '220ms' }}
          >
            <div className='or-surface overflow-hidden'>
              <div className='flex items-center gap-2 border-b px-3 py-2.5'>
                <Search className='text-muted-foreground size-4' />
                <span className='text-muted-foreground text-sm'>
                  {t('Search models, providers, capabilities...')}
                </span>
                <span className='or-kbd ms-auto'>/</span>
              </div>
              <div className='text-muted-foreground grid grid-cols-[84px_minmax(0,1fr)_88px] gap-3 border-b px-4 py-2 text-[11px] font-medium tracking-[0.16em] uppercase'>
                <span>{t('Popularity')}</span>
                <span>{t('Model')}</span>
                <span className='justify-self-end'>{t('Context')}</span>
              </div>
              <div className='divide-y'>
                {modelRows.map((row) => (
                  <Link
                    key={row.model}
                    to='/pricing'
                    className='hover:bg-muted/35 text-foreground grid grid-cols-[84px_minmax(0,1fr)_88px] items-center gap-3 px-4 py-3 transition-colors'
                  >
                    <div className='flex items-center gap-1.5'>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Flame
                          key={`${row.model}-heat-${index}`}
                          className={`size-3.5 ${index < row.popularity ? 'text-foreground' : 'text-muted-foreground opacity-40'}`}
                        />
                      ))}
                    </div>
                    <div className='min-w-0'>
                      <div className='truncate font-mono text-sm font-medium'>
                        {row.model}
                      </div>
                      <div className='text-muted-foreground mt-0.5 text-xs'>
                        {row.provider}
                      </div>
                    </div>
                    <div className='text-muted-foreground justify-self-end font-mono text-xs'>
                      {row.context}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className='landing-animate-fade-up opacity-0'
          style={{ animationDelay: '300ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}
