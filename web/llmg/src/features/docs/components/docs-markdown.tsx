import { createElement, isValidElement, useEffect, useMemo, useState } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { Link2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { BundledLanguage } from 'shiki/bundle/web'
import { cn } from '@/lib/utils'
import { highlightCode } from '@/components/ai-elements/code-block'
import { slugifyHeading } from '../lib'

type DocsMarkdownProps = {
  children: string
  className?: string
}

const DOCS_HIGHLIGHT_ALIASES: Record<string, string> = {
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  python: 'python',
  py: 'python',
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  jsonc: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  markdown: 'markdown',
  md: 'markdown',
  powershell: 'powershell',
  ps1: 'powershell',
}

function flattenText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => flattenText(child)).join('')
  }

  if (isValidElement(node)) {
    return flattenText((node as ReactElement<{ children?: ReactNode }>).props.children)
  }

  return ''
}

function createHeading(level: 'h1' | 'h2' | 'h3') {
  return function Heading({ children }: { children?: ReactNode }) {
    const text = flattenText(children)
    const id = slugifyHeading(text)

    return createElement(
      level,
      {
        id,
        className: cn(
          'group scroll-mt-24',
          level === 'h1' && 'mt-0 text-3xl font-semibold tracking-tight',
          level === 'h2' && 'mt-10 text-xl font-semibold tracking-tight',
          level === 'h3' && 'mt-8 text-base font-semibold tracking-tight'
        ),
      },
      [
        children,
        level !== 'h1'
          ? createElement(
              'a',
              {
                key: `${id}-anchor`,
                href: `#${id}`,
                className:
                  'text-muted-foreground ml-2 inline-flex opacity-0 transition-opacity group-hover:opacity-100',
                'aria-label': `Jump to ${text}`,
              },
              createElement(Link2, { className: 'size-4' })
            )
          : null,
      ]
    )
  }
}

function getCodeBlockLanguage(node: ReactNode): string {
  if (Array.isArray(node) && node.length > 0) {
    return getCodeBlockLanguage(node[0])
  }

  if (isValidElement(node)) {
    const className = (node as ReactElement<{ className?: string }>).props.className
    const matched = className?.match(/language-([\w-]+)/)

    if (matched?.[1]) {
      return matched[1].toUpperCase()
    }
  }

  return 'TEXT'
}

function getCodeBlockInfo(node: ReactNode): { code: string; language?: string } {
  if (Array.isArray(node) && node.length > 0) {
    for (const child of node) {
      const next = getCodeBlockInfo(child)
      if (next.code) {
        return next
      }
    }
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{
      className?: string
      children?: ReactNode
    }>
    const matched = element.props.className?.match(/language-([\w-]+)/)

    return {
      code: flattenText(element.props.children).replace(/\n$/, ''),
      language: matched?.[1],
    }
  }

  return {
    code: flattenText(node).replace(/\n$/, ''),
  }
}

function resolveDocsHighlightLanguage(language?: string): BundledLanguage | null {
  if (!language) {
    return null
  }

  const normalized = language.toLowerCase()

  if (normalized === 'text' || normalized === 'txt' || normalized === 'plaintext') {
    return null
  }

  return (DOCS_HIGHLIGHT_ALIASES[normalized] ?? normalized) as BundledLanguage
}

function DocsCodeBlock({ children }: { children?: ReactNode }) {
  const { code, language } = useMemo(() => getCodeBlockInfo(children), [children])
  const resolvedLanguage = useMemo(
    () => resolveDocsHighlightLanguage(language),
    [language]
  )
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    if (!resolvedLanguage || !code) {
      setHighlightedHtml('')
      return () => {
        cancelled = true
      }
    }

    setHighlightedHtml('')

    highlightCode(code, resolvedLanguage)
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHighlightedHtml('')
        }
      })

    return () => {
      cancelled = true
    }
  }, [code, resolvedLanguage])

  return (
    <div className='not-prose my-5 overflow-hidden rounded-lg border bg-background/70 shadow-none'>
      <div className='bg-muted/50 border-b px-4 py-2'>
        <span className='text-muted-foreground font-mono text-[11px] font-medium uppercase'>
          {getCodeBlockLanguage(children)}
        </span>
      </div>

      {highlightedHtml ? (
        <div
          className='overflow-hidden [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-4 [&>pre]:text-sm [&_code]:font-mono [&_code]:text-sm [&_code]:leading-relaxed'
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className='m-0 overflow-x-auto bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground'>
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

export function DocsMarkdown({ children, className }: DocsMarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        'prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:text-3xl prose-h2:border-b prose-h2:border-border/60 prose-h2:pb-3 prose-h2:text-xl prose-h3:text-lg',
        'prose-p:my-3 prose-p:leading-relaxed prose-p:text-muted-foreground',
        'prose-li:my-1.5 prose-li:text-muted-foreground prose-li:marker:text-primary/65',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground',
        'prose-img:rounded-lg prose-img:border prose-img:shadow-sm',
        'prose-hr:border-border/60',
        'prose-ul:my-3 prose-ol:my-3',
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        '[overflow-wrap:anywhere] break-words',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: createHeading('h1'),
          h2: createHeading('h2'),
          h3: createHeading('h3'),
          a: ({ href, ...props }) => {
            const isExternal = Boolean(
              href && /^(https?:)?\/\//.test(href)
            )

            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              />
            )
          },
          pre: ({ children: codeChildren }) => <DocsCodeBlock>{codeChildren}</DocsCodeBlock>,
          code: ({ className: codeClassName, children: codeChildren, ...props }) => {
            const isBlockCode = Boolean(codeClassName && /language-/.test(codeClassName))

            if (isBlockCode) {
              return (
                <code
                  className={cn('bg-transparent p-0 text-inherit', codeClassName)}
                  {...props}
                >
                  {codeChildren}
                </code>
              )
            }

            return (
              <code
                className='bg-muted rounded border px-1 py-0.5 text-[0.92em] before:content-none after:content-none'
                {...props}
              >
                {codeChildren}
              </code>
            )
          },
          blockquote: ({ children: quoteChildren }) => (
            <blockquote className='not-prose my-5 rounded-lg border-l-4 border-l-primary bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground/90'>
              {quoteChildren}
            </blockquote>
          ),
          table: ({ children: tableChildren }) => (
            <div className='not-prose my-5 overflow-hidden rounded-lg border bg-background/70 shadow-none'>
              <div className='overflow-x-auto'>
                <table className='m-0 w-full text-sm'>{tableChildren}</table>
              </div>
            </div>
          ),
          thead: ({ children: headChildren }) => (
            <thead className='bg-muted'>{headChildren}</thead>
          ),
          th: ({ className: thClassName, ...props }) => (
            <th
              className={cn(
                'border px-3 py-2 text-left text-xs font-semibold tracking-[0.14em] uppercase',
                thClassName
              )}
              {...props}
            />
          ),
          td: ({ className: tdClassName, ...props }) => (
            <td
              className={cn('border px-3 py-2 text-muted-foreground', tdClassName)}
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}