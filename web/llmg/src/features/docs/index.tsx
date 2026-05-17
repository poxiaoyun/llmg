import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Copy,
  Search,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { canAccessSystemSettings } from '@/lib/roles'
import { PublicLayout } from '@/components/layout'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FEATURED_DOC_IDS,
  filterDocsNav,
  getDocsNeighbors,
  getDocsPage,
  getDocsPages,
  getDocSearch,
  isCliDocsPage,
  type DocsPageId,
} from './content'
import { DocsMarkdown } from './components/docs-markdown'
import { extractDocsHeadings } from './lib'

type DocsProps = {
  pageId?: DocsPageId
}

function DocsSkeleton() {
  return (
    <div className='grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_220px]'>
      <div className='space-y-2'>
        <Skeleton className='h-11 w-full rounded-2xl' />
        <Skeleton className='h-9 w-full rounded-xl' />
        <Skeleton className='h-9 w-5/6 rounded-xl' />
        <Skeleton className='h-9 w-full rounded-xl' />
      </div>
      <div className='space-y-5'>
        <Skeleton className='h-6 w-36' />
        <Skeleton className='h-16 w-2/3 rounded-2xl' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-44 w-full rounded-[2rem]' />
        <Skeleton className='h-80 w-full rounded-[2rem]' />
      </div>
      <div className='hidden xl:block'>
        <Skeleton className='h-48 w-full rounded-[1.5rem]' />
      </div>
    </div>
  )
}

export function Docs({ pageId }: DocsProps) {
  const { t, i18n } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard({ notify: true })
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const [query, setQuery] = useState('')
  const [cliOpenOverride, setCliOpenOverride] = useState<boolean | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const canOpenSystemSettings = canAccessSystemSettings(userRole)

  const pages = useMemo(
    () => getDocsPages(t, i18n.resolvedLanguage),
    [i18n.resolvedLanguage, t]
  )
  const currentPage = useMemo(
    () => getDocsPage(pages, pageId),
    [pageId, pages]
  )

  const { data } = useQuery({
    queryKey: ['llmg-docs-content', i18n.resolvedLanguage, currentPage.markdownPath],
    queryFn: async () => {
      const response = await fetch(currentPage.markdownPath)
      if (!response.ok) {
        throw new Error(`Failed to load docs content: ${response.status}`)
      }
      return response.text()
    },
    staleTime: Infinity,
  })

  const filteredNavItems = useMemo(
    () => filterDocsNav(pages, query, t),
    [pages, query, t]
  )
  const headings = useMemo(() => (data ? extractDocsHeadings(data) : []), [data])
  const featuredPages = useMemo(
    () => FEATURED_DOC_IDS.map((id) => pages[id]),
    [pages]
  )
  const neighbors = useMemo(
    () => getDocsNeighbors(pages, currentPage.id),
    [currentPage.id, pages]
  )
  const cliOpen =
    cliOpenOverride ?? (isCliDocsPage(pages, currentPage.id) || query.trim().length > 0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleCopyPageLink = async () => {
    if (typeof window !== 'undefined') {
      await copyToClipboard(window.location.href)
    }
  }

  if (!data) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='or-grid-bg relative min-h-svh'>
          <div className='mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'>
            <DocsSkeleton />
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='or-grid-bg relative min-h-svh'>
        <div
          id='docs-top'
          className='mx-auto w-full max-w-[1800px] px-3 pt-16 pb-8 sm:px-6 sm:pt-20 sm:pb-10 xl:px-8'
        >
          <div className='grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_220px]'>
            <aside className='lg:sticky lg:top-4 lg:self-start'>
              <div className='bg-background/75 rounded-lg border p-3 shadow-none backdrop-blur'>
                <div className='relative mb-3'>
                  <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                  <Input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('docs.shell.searchPlaceholder')}
                    className='h-9 rounded-md border-border bg-background/60 pl-9 pr-14'
                  />
                  <kbd className='bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block'>
                    ⌘K
                  </kbd>
                </div>

                <nav className='space-y-1'>
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map((item) => {
                      if (item.type === 'page') {
                        const active = item.page.id === currentPage.id

                        return (
                          <Link
                            key={item.page.id}
                            to='/docs'
                            search={getDocSearch(item.page.id)}
                            className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${
                              active
                                ? 'bg-muted text-foreground border border-border'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                          >
                            <span className='truncate'>{item.page.title}</span>
                          </Link>
                        )
                      }

                      return (
                        <Collapsible
                          key={item.id}
                          open={cliOpen}
                          onOpenChange={(open) => setCliOpenOverride(open)}
                        >
                          <CollapsibleTrigger className='text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors'>
                            <span>{item.title}</span>
                            <ChevronRight
                              className={`size-4 transition-transform ${
                                cliOpen ? 'text-foreground rotate-90' : ''
                              }`}
                            />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className='mt-1 ml-2 border-l pl-3'>
                              {item.pages.map((page) => {
                                const active = page.id === currentPage.id

                                return (
                                  <Link
                                    key={page.id}
                                    to='/docs'
                                    search={getDocSearch(page.id)}
                                    className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                                      active
                                        ? 'bg-muted text-foreground border border-border'
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                                  >
                                    <span className='truncate'>{page.title}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })
                  ) : (
                    <div className='text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-sm'>
                      {t('docs.shell.noMatches')}
                    </div>
                  )}
                </nav>
              </div>
            </aside>

            <article className='min-w-0 space-y-4'>
              <div className='bg-background/75 rounded-lg border p-6 shadow-none backdrop-blur sm:p-8'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div className='space-y-3'>
                    <div className='text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase'>
                      {currentPage.sectionTitle}
                    </div>
                    <h1 className='text-foreground text-3xl font-semibold tracking-tight sm:text-4xl'>
                      {currentPage.title}
                    </h1>
                    <p className='text-muted-foreground max-w-3xl text-base leading-7'>
                      {currentPage.description}
                    </p>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    {canOpenSystemSettings && (
                      <Button
                        variant='outline'
                        size='sm'
                        render={
                          <Link
                            to='/system-settings/site/$section'
                            params={{ section: 'system-info' }}
                          />
                        }
                      >
                        <Settings />
                        {t('System Settings')}
                      </Button>
                    )}
                    <Button variant='outline' size='sm' onClick={handleCopyPageLink}>
                      <Copy />
                      {t('docs.shell.copyPage')}
                    </Button>
                  </div>
                </div>
              </div>

              {currentPage.id === 'overview' && (
                <section className='space-y-4'>
                  <div>
                    <h2 className='text-foreground text-xl font-semibold tracking-tight'>
                      {t('docs.shell.pickAPathTitle')}
                    </h2>
                    <p className='text-muted-foreground mt-2 max-w-2xl text-sm leading-6'>
                      {t('docs.shell.pickAPathDescription')}
                    </p>
                  </div>

                  <div className='grid gap-4 md:grid-cols-3'>
                    {featuredPages.map((page) => {
                      const Icon = page.icon

                      return (
                        <Link
                          key={page.id}
                          to='/docs'
                          search={getDocSearch(page.id)}
                          className='block'
                        >
                          <Card className='bg-background/75 h-full rounded-lg py-0 shadow-none transition-colors hover:bg-muted/40'>
                            <CardHeader className='px-5 pt-5'>
                              <div className='bg-background/70 text-foreground flex size-10 items-center justify-center rounded-md border'>
                                <Icon className='size-4' />
                              </div>
                              <CardTitle className='pt-3 text-base'>
                                {page.title}
                              </CardTitle>
                              <CardDescription className='leading-6'>
                                {page.summary}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className='px-5 pb-5 pt-0 text-sm font-medium'>
                              <span className='inline-flex items-center gap-1'>
                                {t('docs.shell.openGuide')}
                                <ArrowRight className='size-4' />
                              </span>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              <div className='bg-background/75 rounded-lg border px-6 py-7 shadow-none backdrop-blur sm:px-8 sm:py-8'>
                <DocsMarkdown>{data}</DocsMarkdown>
              </div>

              <div className='grid gap-3 md:grid-cols-2'>
                {neighbors.previous ? (
                  <Link
                    to='/docs'
                    search={getDocSearch(neighbors.previous.id)}
                    className='bg-background/75 block rounded-lg border px-5 py-4 shadow-none transition-colors hover:bg-muted/40'
                  >
                    <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase'>
                      <ArrowLeft className='size-3.5' />
                      {t('docs.shell.previous')}
                    </div>
                    <div className='mt-2 text-base font-semibold'>
                      {neighbors.previous.title}
                    </div>
                    <div className='text-muted-foreground mt-1 text-sm leading-6'>
                      {neighbors.previous.summary}
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {neighbors.next ? (
                  <Link
                    to='/docs'
                    search={getDocSearch(neighbors.next.id)}
                    className='bg-background/75 block rounded-lg border px-5 py-4 text-right shadow-none transition-colors hover:bg-muted/40'
                  >
                    <div className='text-muted-foreground flex items-center justify-end gap-2 text-xs font-medium tracking-[0.16em] uppercase'>
                      {t('docs.shell.next')}
                      <ArrowRight className='size-3.5' />
                    </div>
                    <div className='mt-2 text-base font-semibold'>
                      {neighbors.next.title}
                    </div>
                    <div className='text-muted-foreground mt-1 text-sm leading-6'>
                      {neighbors.next.summary}
                    </div>
                  </Link>
                ) : null}
              </div>
            </article>

            <aside className='hidden xl:block'>
              <div className='bg-background/75 sticky top-4 rounded-lg border p-4 shadow-none backdrop-blur'>
                <div className='text-sm font-semibold'>
                  {t('docs.shell.onThisPage')}
                </div>
                <div className='mt-4 space-y-1.5'>
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                        heading.depth === 3
                          ? 'text-muted-foreground pl-5 hover:text-foreground'
                          : 'text-foreground/85 hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {heading.title}
                    </a>
                  ))}
                </div>
                <div className='mt-6 border-t pt-4'>
                  <a
                    href='#docs-top'
                    className='text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors'
                  >
                    {t('docs.shell.scrollToTop')}
                    <ArrowUp className='size-4' />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}