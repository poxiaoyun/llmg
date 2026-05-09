import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement>

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'bg-background/85 sticky top-0 z-40 h-[var(--app-header-height,4rem)] w-full shrink-0 border-b backdrop-blur-xl',
        className
      )}
      {...props}
    >
      <div className='flex h-full items-center gap-3 px-3.5 sm:px-5'>
        <SidebarTrigger variant='ghost' className='size-9' />
        {children}
      </div>
    </header>
  )
}
