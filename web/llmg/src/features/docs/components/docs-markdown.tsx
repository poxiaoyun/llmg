import {
  createElement,
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
    return flattenText(
      (node as ReactElement<{ children?: ReactNode }>).props.children
    )
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
          'group scroll-mt-24 text-foreground',
          level === 'h1' &&
            'mt-0 mb-5 text-3xl font-semibold leading-tight tracking-tight sm:text-[2rem]',
          level === 'h2' &&
            'mt-10 mb-3 border-b border-border/70 pb-2 text-[1.35rem] font-semibold leading-snug tracking-tight',
          level === 'h3' &&
            'mt-7 mb-2 text-lg font-semibold leading-snug tracking-tight'
        ),
      },
      children,
      level !== 'h1'
        ? createElement(
            'a',
            {
              key: `${id}-anchor`,
              href: `#${id}`,
              className:
                'ml-2 inline-flex align-middle text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100',
              'aria-label': `Jump to ${text}`,
            },
            createElement(Link2, { className: 'size-4' })
          )
        : null
    )
  }
}

function getCodeBlockLanguage(node: ReactNode): string {
  if (Array.isArray(node) && node.length > 0) {
    return getCodeBlockLanguage(node[0])
  }

  if (isValidElement(node)) {
    const className = (node as ReactElement<{ className?: string }>).props
      .className
    const matched = className?.match(/language-([\w-]+)/)

    if (matched?.[1]) {
      return matched[1].toUpperCase()
    }
  }

  return 'TEXT'
}

function getCodeBlockInfo(node: ReactNode): {
  code: string
  language?: string
} {
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

function resolveDocsHighlightLanguage(
  language?: string
): BundledLanguage | null {
  if (!language) {
    return null
  }

  const normalized = language.toLowerCase()

  if (
    normalized === 'text' ||
    normalized === 'txt' ||
    normalized === 'plaintext'
  ) {
    return null
  }

  return (DOCS_HIGHLIGHT_ALIASES[normalized] ?? normalized) as BundledLanguage
}

function DocsCodeBlock({ children }: { children?: ReactNode }) {
  const { code, language } = useMemo(
    () => getCodeBlockInfo(children),
    [children]
  )
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
    <div className='not-prose bg-background/70 my-5 overflow-hidden rounded-md border shadow-none'>
      <div className='bg-muted/45 border-b px-4 py-2'>
        <span className='text-muted-foreground font-mono text-[11px] font-medium uppercase'>
          {getCodeBlockLanguage(children)}
        </span>
      </div>

      {highlightedHtml ? (
        <div
          className='overflow-hidden [&_code]:font-mono [&_code]:text-sm [&_code]:leading-6 [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-4 [&>pre]:text-sm'
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className='text-foreground m-0 overflow-x-auto bg-transparent px-4 py-3 text-sm leading-6'>
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
        'prose prose-base dark:prose-invert max-w-none',
        'prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:mb-5 prose-h1:text-3xl prose-h1:leading-tight prose-h2:mt-10 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2 prose-h2:text-[1.35rem] prose-h2:leading-snug prose-h3:mt-7 prose-h3:mb-2 prose-h3:text-lg prose-h3:leading-snug',
        'prose-p:my-3 prose-p:leading-7 prose-p:text-foreground/78',
        'prose-li:my-1.5 prose-li:leading-7 prose-li:text-foreground/78 prose-li:marker:text-primary/65',
        'prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground',
        'prose-img:rounded-md prose-img:border prose-img:shadow-sm',
        'prose-hr:border-border/60',
        'prose-ul:my-4 prose-ol:my-4',
        'prose-th:text-foreground prose-td:leading-6',
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
            const isExternal = Boolean(href && /^(https?:)?\/\//.test(href))

            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              />
            )
          },
          pre: ({ children: codeChildren }) => (
            <DocsCodeBlock>{codeChildren}</DocsCodeBlock>
          ),
          code: ({
            className: codeClassName,
            children: codeChildren,
            ...props
          }) => {
            const isBlockCode = Boolean(
              codeClassName && /language-/.test(codeClassName)
            )

            if (isBlockCode) {
              return (
                <code
                  className={cn(
                    'bg-transparent p-0 text-inherit',
                    codeClassName
                  )}
                  {...props}
                >
                  {codeChildren}
                </code>
              )
            }

            return (
              <code
                className='bg-muted/75 text-foreground rounded-md border px-1.5 py-0.5 text-[0.9em] before:content-none after:content-none'
                {...props}
              >
                {codeChildren}
              </code>
            )
          },
          blockquote: ({ children: quoteChildren }) => (
            <blockquote className='not-prose border-border/70 border-l-primary/70 bg-muted/35 text-foreground/85 [&_a]:text-primary [&_code]:bg-background/80 [&_strong]:text-foreground my-5 rounded-md border border-l-[3px] px-4 py-3 text-[0.95rem] leading-7 [&_a]:font-medium [&_code]:rounded-md [&_code]:border [&_code]:px-1.5 [&_code]:py-0.5 [&>p]:m-0 [&>p+p]:mt-2'>
              {quoteChildren}
            </blockquote>
          ),
          table: ({ children: tableChildren }) => (
            <div className='not-prose bg-background/70 my-5 overflow-hidden rounded-md border shadow-none'>
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
                'text-foreground border px-3 py-2 text-left text-xs font-semibold tracking-[0.12em] uppercase',
                thClassName
              )}
              {...props}
            />
          ),
          td: ({ className: tdClassName, ...props }) => (
            <td
              className={cn(
                'text-foreground/78 border px-3 py-2.5 leading-6',
                tdClassName
              )}
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
