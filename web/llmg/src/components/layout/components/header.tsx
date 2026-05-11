import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'bg-background/85 fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'w-full px-4 transition-colors duration-200 md:px-6',
          scrolled && 'bg-background/40'
        )}
      >
        <div className='flex h-[var(--app-header-height,4rem)] w-full items-center gap-4'>
          {children}
        </div>
      </div>
    </header>
  )
}
