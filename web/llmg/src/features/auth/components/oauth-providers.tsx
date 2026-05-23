import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  IconDiscord,
  IconGithub,
  IconLinuxDo,
  IconWeChat,
} from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOAuthLogin } from '../hooks/use-oauth-login'
import type { SystemStatus } from '../types'

function GoogleStyleMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden='true'
      className={className}
      viewBox='0 0 18 18'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.56 2.68-3.86 2.68-6.62Z'
        fill='#4285F4'
      />
      <path
        d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.31-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18Z'
        fill='#34A853'
      />
      <path
        d='M3.98 10.72A5.41 5.41 0 0 1 3.7 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.02-2.33Z'
        fill='#FBBC05'
      />
      <path
        d='M9 3.58c1.32 0 2.5.45 3.44 1.33l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33c.7-2.12 2.68-3.7 5.02-3.7Z'
        fill='#EA4335'
      />
    </svg>
  )
}

type OAuthProvidersProps = {
  status: SystemStatus | null
  disabled?: boolean
  className?: string
  onWeChatLogin?: () => void
  isWeChatLoading?: boolean
}

type ProviderButton = {
  key: string
  label: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
  buttonClassName?: string
  content?: ReactNode
}

export function OAuthProviders({
  status,
  disabled = false,
  className,
  onWeChatLogin,
  isWeChatLoading = false,
}: OAuthProvidersProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    githubButtonText,
    githubButtonDisabled,
    handleGitHubLogin,
    handleDiscordLogin,
    handleOIDCLogin,
    handleLinuxDOLogin,
    handleTelegramLogin,
    handleCustomOAuthLogin,
  } = useOAuthLogin(status)

  const providerButtons: ProviderButton[] = []

  if (status?.wechat_login && onWeChatLogin) {
    providerButtons.push({
      key: 'wechat',
      label: t('Continue with WeChat'),
      onClick: onWeChatLogin,
      icon: <IconWeChat className='h-4 w-4' />,
      disabled: isWeChatLoading,
    })
  }

  if (status?.github_oauth) {
    providerButtons.push({
      key: 'github',
      label: githubButtonText || t('Continue with GitHub'),
      onClick: handleGitHubLogin,
      icon: <IconGithub className='h-4 w-4' />,
      disabled: githubButtonDisabled,
    })
  }

  if (status?.discord_oauth) {
    providerButtons.push({
      key: 'discord',
      label: t('Continue with Discord'),
      onClick: handleDiscordLogin,
      icon: <IconDiscord className='h-4 w-4' />,
    })
  }

  if (status?.oidc_enabled) {
    providerButtons.push({
      key: 'oidc',
      label: t('Sign in with Google'),
      onClick: handleOIDCLogin,
      buttonClassName:
        'h-12 justify-start rounded-[4px] border-[#dadce0] bg-white px-4 text-[#3c4043] shadow-[0_1px_1px_rgba(0,0,0,0.08),0_1px_3px_rgba(60,64,67,0.16)] hover:bg-[#f8f9fa] hover:text-[#202124] focus-visible:border-[#4285f4] focus-visible:ring-[#4285f4]/30 dark:border-[#dadce0] dark:bg-white dark:text-[#3c4043] dark:hover:bg-[#f8f9fa] dark:hover:text-[#202124]',
      content: (
        <span className='grid w-full grid-cols-[18px_minmax(0,1fr)_18px] items-center gap-4'>
          <GoogleStyleMark className='h-[18px] w-[18px] shrink-0' />
          <span className='min-w-0 text-center text-[14px] font-medium tracking-[0.01em] text-[#3c4043]'>
            {t('Sign in with Google')}
          </span>
          <span aria-hidden='true' className='h-[18px] w-[18px]' />
        </span>
      ),
    })
  }

  if (status?.linuxdo_oauth) {
    providerButtons.push({
      key: 'linuxdo',
      label: t('Continue with LinuxDO'),
      onClick: handleLinuxDOLogin,
      icon: <IconLinuxDo className='h-4 w-4' />,
    })
  }

  if (status?.telegram_oauth) {
    providerButtons.push({
      key: 'telegram',
      label: t('Continue with Telegram'),
      onClick: handleTelegramLogin,
    })
  }

  // Custom OAuth providers
  const customProviders = status?.custom_oauth_providers
  if (customProviders && customProviders.length > 0) {
    for (const provider of customProviders) {
      providerButtons.push({
        key: `custom-${provider.slug}`,
        label: t('Continue with {{name}}', { name: provider.name }),
        onClick: () => handleCustomOAuthLogin(provider),
      })
    }
  }

  if (providerButtons.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>
            {t('Or continue with')}
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        {providerButtons.map(
          ({
            key,
            label,
            onClick,
            icon,
            disabled: extraDisabled,
            buttonClassName,
            content,
          }) => (
            <Button
              key={key}
              variant='outline'
              type='button'
              disabled={disabled || isLoading || extraDisabled}
              onClick={onClick}
              className={cn(
                'h-11 w-full justify-center gap-2 rounded-lg',
                buttonClassName
              )}
            >
              {content ?? (
                <>
                  {icon}
                  {label}
                </>
              )}
            </Button>
          )
        )}
      </div>
    </div>
  )
}
