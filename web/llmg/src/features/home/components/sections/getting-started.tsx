import { KeyRound, Rocket, UserRoundPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { AnimateInView } from '@/components/animate-in-view'

const STEP_ICONS = [UserRoundPlus, KeyRound, Rocket] as const

export function GettingStarted() {
  const { t } = useTranslation()
  const steps = [
    {
      title: t('Create an account'),
      description: t(
        'Register your workspace in minutes, bring teammates in when you need them, and keep billing, usage, and access decisions under one shared control plane.'
      ),
    },
    {
      title: t('Get your API key'),
      description: t(
        'Generate a key for each app or environment, keep upstream provider credentials behind the gateway, and rotate access safely without rewriting client integrations.'
      ),
    },
    {
      title: t('Start building'),
      description: t(
        'Send your first request with cURL, the OpenAI SDK, or the Anthropic SDK using the same endpoint pattern shown above, then scale into routing, quotas, and observability as traffic grows.'
      ),
    },
  ]

  return (
    <section className='relative z-10 overflow-hidden border-t px-4 py-16 md:py-20'>
      <div className='mx-auto w-full max-w-7xl'>
        <AnimateInView animation='fade-up' className='mb-8 text-center md:mb-10'>
          <h2 className='text-3xl leading-tight font-semibold tracking-tight text-balance md:text-5xl'>
            {t('Getting Started')}
          </h2>
        </AnimateInView>

        <div className='grid gap-4 md:grid-cols-3'>
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index]

            return (
              <AnimateInView
                key={step.title}
                animation='fade-up'
                delay={index * 80}
                className={cn('or-surface relative overflow-hidden px-5 py-5 md:px-6 md:py-6')}
              >
                <div className='absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(17,24,39,0.18),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]' />
                <div className='flex items-start gap-4'>
                  <div className='bg-muted text-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl border'>
                    <Icon className='size-5' />
                  </div>
                  <div className='min-w-0'>
                    <div className='text-muted-foreground mb-2 font-mono text-xs tracking-[0.18em] uppercase'>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <h3 className='text-lg font-semibold tracking-tight'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}