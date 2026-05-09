import { Link } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
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
  const { systemName } = useSystemConfig()
  const modelRows = [
    {
      model: 'openai/gpt-4.1',
      provider: 'OpenAI',
      context: '1M',
      price: '$2.00/M',
    },
    {
      model: 'anthropic/claude-sonnet',
      provider: 'Anthropic',
      context: '200K',
      price: '$3.00/M',
    },
    {
      model: 'google/gemini-pro',
      provider: 'Google',
      context: '1M',
      price: '$1.25/M',
    },
  ]

  return (
    <section className='or-grid-bg relative z-10 overflow-hidden border-b px-4 pt-28 pb-12 md:pt-32 md:pb-16'>
      <div className='mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]'>
        <div className='flex max-w-3xl flex-col items-start'>
          <div className='or-eyebrow mb-4'>{t('AI Gateway')}</div>
          <h1
            className='landing-animate-fade-up text-[clamp(2.25rem,7vw,4.75rem)] leading-[0.98] font-semibold tracking-tight text-balance'
            style={{ animationDelay: '0ms' }}
          >
            {t('Unified interface for all your AI models')}
          </h1>
          <p
            className='landing-animate-fade-up text-muted-foreground mt-5 max-w-xl text-base leading-relaxed opacity-0 md:text-lg'
            style={{ animationDelay: '80ms' }}
          >
            {systemName}{' '}
            {t(
              'is an open-source AI API gateway for self-hosted deployments. Connect multiple upstream services, manage models, keys, quotas, logs, and routing policies in one place.'
            )}
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
            <div className='divide-y'>
              {modelRows.map((row) => (
                <Link
                  key={row.model}
                  to='/pricing'
                  className='hover:bg-muted/35 text-foreground grid grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-3 px-4 py-3 transition-colors'
                >
                  <div className='min-w-0'>
                    <div className='truncate font-mono text-sm font-medium'>
                      {row.model}
                    </div>
                    <div className='text-muted-foreground mt-0.5 text-xs'>
                      {row.provider}
                    </div>
                  </div>
                  <div className='text-muted-foreground font-mono text-xs'>
                    {row.context}
                  </div>
                  <div className='justify-self-end font-mono text-xs'>
                    {row.price}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          className='landing-animate-fade-up opacity-0 lg:col-span-2'
          style={{ animationDelay: '300ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}
