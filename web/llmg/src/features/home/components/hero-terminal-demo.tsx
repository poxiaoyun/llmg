import { useState, useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AccentTone = 'emerald' | 'amber' | 'blue' | 'neutral'

interface ApiDemoConfig {
  id: string
  label: string
  badge: string
  endpoint: string
  request: string[]
  tokens: number
  latency: number
  accent: AccentTone
}

const ACCENT_CLASSES: Record<
  AccentTone,
  {
    activeText: string
    activeBorder: string
    badge: string
  }
> = {
  emerald: {
    activeText: 'text-emerald-600 dark:text-emerald-400',
    activeBorder: 'border-emerald-500 dark:border-emerald-400',
    badge:
      'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400',
  },
  amber: {
    activeText: 'text-amber-600 dark:text-amber-400',
    activeBorder: 'border-amber-500 dark:border-amber-400',
    badge:
      'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
  },
  blue: {
    activeText: 'text-blue-600 dark:text-blue-400',
    activeBorder: 'border-blue-500 dark:border-blue-400',
    badge:
      'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
  },
  neutral: {
    activeText: 'text-zinc-700 dark:text-zinc-200',
    activeBorder: 'border-zinc-700 dark:border-zinc-200',
    badge: 'bg-zinc-950/10 text-zinc-700 dark:bg-zinc-50/10 dark:text-zinc-200',
  },
}

const API_DEMOS: ApiDemoConfig[] = [
  {
    id: 'curl-stream',
    label: 'cURL',
    badge: 'SSE',
    endpoint: '/v1/chat/completions',
    request: [
      'curl "https://api.your-domain.com/v1/chat/completions" \\',
      '  -N \\',
      '  -H "Authorization: Bearer $LLMG_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{",
      '    "model": "gpt-4o-mini",',
      '    "stream": true,',
      '    "messages": [',
      '      { "role": "user", "content": "Plan a release checklist" }',
      '    ]',
      "  }'",
    ],
    tokens: 64,
    latency: 118,
    accent: 'emerald',
  },
  {
    id: 'openai-sdk-stream',
    label: 'OpenAI SDK',
    badge: 'node',
    endpoint: 'OpenAI-compatible /v1',
    request: [
      'import OpenAI from "openai"',
      '',
      'const client = new OpenAI({',
      '  apiKey: process.env.LLMG_API_KEY,',
      '  baseURL: "https://api.your-domain.com/v1",',
      '})',
      '',
      'const stream = await client.chat.completions.create({',
      '  model: "gpt-4o-mini",',
      '  stream: true,',
      '  messages: [{ role: "user", content: "Ship status?" }],',
      '})',
      '',
      'for await (const chunk of stream)',
      '  process.stdout.write(chunk.choices[0]?.delta?.content ?? "")',
    ],
    tokens: 72,
    latency: 134,
    accent: 'amber',
  },
  {
    id: 'anthropic-sdk-stream',
    label: 'Anthropic SDK',
    badge: 'node',
    endpoint: 'Anthropic-compatible /v1/messages',
    request: [
      'import Anthropic from "@anthropic-ai/sdk"',
      '',
      'const client = new Anthropic({',
      '  apiKey: process.env.LLMG_API_KEY,',
      '  baseURL: "https://api.your-domain.com",',
      '})',
      '',
      'const stream = client.messages.stream({',
      '  model: "claude-3-5-sonnet-latest",',
      '  max_tokens: 512,',
      '  messages: [{ role: "user", content: "Summarize routing health" }],',
      '})',
      '',
      'for await (const event of stream)',
      '  if (event.type === "content_block_delta") process.stdout.write(event.delta.text ?? "")',
    ],
    tokens: 81,
    latency: 149,
    accent: 'blue',
  },
]

const STREAM_START_DELAY_MS = 180
const STREAM_CHAR_DELAY_MS = 12
const STREAM_LINE_DELAY_MS = 90

export function HeroTerminalDemo() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [streamDone, setStreamDone] = useState(false)
  const streamTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const demo = API_DEMOS[activeIndex]
  const accent = ACCENT_CLASSES[demo.accent]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current)

    if (mq.matches) {
      setVisibleLines(demo.request)
      setStreamDone(true)
      return
    }

    let cancelled = false
    let lineIndex = 0
    let charIndex = 0
    setVisibleLines([''])
    setStreamDone(false)

    const tick = () => {
      if (cancelled) return
      const line = demo.request[lineIndex]

      if (line === undefined) {
        setStreamDone(true)
        return
      }

      setVisibleLines((prev) => {
        const next = prev.slice(0, lineIndex + 1)
        next[lineIndex] = line.slice(0, charIndex)
        return next
      })

      charIndex += 1
      if (charIndex > line.length) {
        lineIndex += 1
        charIndex = 0
        if (lineIndex < demo.request.length) {
          setVisibleLines((prev) => [...prev, ''])
        }
        streamTimerRef.current = setTimeout(tick, STREAM_LINE_DELAY_MS)
        return
      }

      streamTimerRef.current = setTimeout(tick, STREAM_CHAR_DELAY_MS)
    }

    streamTimerRef.current = setTimeout(tick, STREAM_START_DELAY_MS)

    return () => {
      cancelled = true
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
    }
  }, [demo])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    if (!streamDone || mq.matches) return

    rotateTimerRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % API_DEMOS.length)
    }, 1800)

    return () => {
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    }
  }, [streamDone])

  const handleSelect = (index: number) => {
    if (index === activeIndex) return
    if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current)
    setActiveIndex(index)
  }

  return (
    <div className='mx-auto mt-4 w-full max-w-5xl'>
      <div
        className={cn(
          'overflow-hidden rounded-lg border backdrop-blur-sm',
          'border-border bg-card shadow-none',
          'dark:border-white/[0.08] dark:bg-[#090a0b]'
        )}
      >
        {/* Tab strip */}
        <div
          className={cn(
            'flex items-center gap-1 border-b px-2 sm:gap-1.5 sm:px-3',
            'border-border/50 dark:border-white/[0.05]'
          )}
        >
          {API_DEMOS.map((item, index) => {
            const tone = ACCENT_CLASSES[item.accent]
            const isActive = index === activeIndex
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(index)}
                className={cn(
                  'relative -mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[11px] font-medium tracking-wide transition-colors sm:px-3 sm:text-xs',
                  isActive
                    ? `${tone.activeBorder} ${tone.activeText}`
                    : 'text-foreground/40 hover:text-foreground/70 border-transparent'
                )}
              >
                {item.label}
              </button>
            )
          })}
          <div className='ml-auto flex items-center gap-2 pr-2 sm:pr-3'>
            <span className='inline-block size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]' />
            <span className='text-foreground/40 font-mono text-[10px] tracking-wider uppercase'>
              200 ok
            </span>
          </div>
        </div>

        {/* Endpoint row */}
        <div
          className={cn(
            'flex items-center gap-2.5 border-b px-5 py-3',
            'border-border/40 dark:border-white/[0.04]'
          )}
        >
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider',
              accent.badge
            )}
          >
            {demo.badge}
          </span>
          <code
            className='text-foreground/75 truncate font-mono text-[12.5px]'
          >
            {demo.endpoint}
          </code>
        </div>

        <div className='h-[430px] overflow-hidden font-mono text-[12.5px] leading-[1.55]'>
          <RequestBlock
            demo={demo}
            visibleLines={visibleLines}
            streamDone={streamDone}
          />
        </div>

        {/* Footer metrics */}
        <div
          className={cn(
            'flex items-center justify-between border-t px-5 py-2.5',
            'border-border/40 bg-muted/30 dark:border-white/[0.05] dark:bg-white/[0.02]'
          )}
        >
          <div className='text-foreground/40 flex items-center gap-3 text-[10px] tabular-nums'>
            <span className='flex items-center gap-1'>
              <span className='font-mono'>{demo.latency}</span>
              <span className='tracking-wider uppercase'>ms</span>
            </span>
            <span className='bg-foreground/15 size-1 rounded-full' />
            <span className='flex items-center gap-1'>
              <span className='font-mono'>{demo.tokens}</span>
              <span className='tracking-wider uppercase'>tokens</span>
            </span>
            <span className='bg-foreground/15 size-1 rounded-full' />
            <span className='flex items-center gap-1'>
              <span className='tracking-wider uppercase'>cost</span>
              <span className='font-mono'>
                ${(demo.tokens * 0.00003).toFixed(5)}
              </span>
            </span>
          </div>
          <span className='text-foreground/30 font-mono text-[10px] tracking-wider uppercase'>
            live request stream
          </span>
        </div>
      </div>
    </div>
  )
}

function RequestBlock(props: {
  demo: ApiDemoConfig
  visibleLines: string[]
  streamDone: boolean
}) {
  const { demo, visibleLines, streamDone } = props

  return (
    <div className='relative h-full overflow-auto px-5 py-4'>
      <div className='flex items-center justify-between gap-3'>
        <SectionLabel>Request</SectionLabel>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.16em] uppercase',
            streamDone
              ? 'bg-foreground/10 text-foreground/55'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          )}
        >
          {streamDone ? 'complete' : 'streaming'}
        </span>
      </div>
      <div className='mt-3'>
        {visibleLines.map((line, i) => (
          <CodeLine key={`${demo.id}-${i}`}>
            {renderCodeLine(line)}
            {!streamDone && i === visibleLines.length - 1 ? (
              <span className='text-foreground ml-0.5 animate-pulse'>▌</span>
            ) : null}
          </CodeLine>
        ))}
      </div>
    </div>
  )
}

function SectionLabel(props: { children: ReactNode }) {
  return (
    <span className='text-foreground/30 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase'>
      {props.children}
    </span>
  )
}

const STRING_RE = /"[^"]*"/g
function renderCodeLine(line: string): ReactNode {
  if (!line.trim()) return <Muted> </Muted>
  return tokenize(line)
}

function tokenize(input: string): ReactNode {
  // Split string into "..." string runs and the rest, then color keys/punct.
  const segments: ReactNode[] = []
  let cursor = 0
  const matches = [...input.matchAll(STRING_RE)]

  matches.forEach((match, idx) => {
    const start = match.index ?? 0
    if (start > cursor) {
      segments.push(
        <Muted key={`m-${idx}`}>{input.slice(cursor, start)}</Muted>
      )
    }
    const text = match[0]
    const after = input.slice(start + text.length).trimStart()
    const isKey = after.startsWith(':')
    if (isKey) {
      segments.push(<Key key={`k-${idx}`}>{text}</Key>)
    } else {
      segments.push(<StringText key={`s-${idx}`}>{text}</StringText>)
    }
    cursor = start + text.length
  })

  if (cursor < input.length) {
    segments.push(<Muted key='tail'>{input.slice(cursor)}</Muted>)
  }

  return segments
}

function CodeLine(props: { children: ReactNode; indent?: number }) {
  return (
    <div className='break-words whitespace-pre-wrap'>
      {props.indent ? (
        <span
          aria-hidden
          className='inline-block'
          style={{ width: `${props.indent}ch` }}
        />
      ) : null}
      {props.children}
    </div>
  )
}

function Key(props: { children: ReactNode }) {
  return (
    <span className='text-sky-700 dark:text-sky-300'>{props.children}</span>
  )
}

function StringText(props: { children: ReactNode }) {
  return (
    <span className='text-amber-700 dark:text-amber-300'>{props.children}</span>
  )
}

function Muted(props: { children: ReactNode }) {
  return <span className='text-foreground/55'>{props.children}</span>
}
