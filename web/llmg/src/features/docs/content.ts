import type { TFunction } from 'i18next'
import {
  AppWindow,
  BookCopy,
  Bot,
  Box,
  Command,
  Rocket,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'

export const DOC_PAGE_IDS = [
  'overview',
  'quickstart',
  'cli-overview',
  'codex-cli',
  'claude-code-cli',
  'opencode-cli',
  'vscode-extension',
  'api-reference',
  'agents-overview',
  'hermes-agent',
] as const

export type DocsPageId = (typeof DOC_PAGE_IDS)[number]
export type DocsLocale = 'en' | 'zh'

export type DocsPage = {
  id: DocsPageId
  title: string
  summary: string
  description: string
  sectionTitle: string
  markdownPath: string
  updatedAt: string
  icon: LucideIcon
  keywords: string[]
  navGroup?: 'cli' | 'agents'
}

type DocsPageDefinition = {
  markdownName: string
  sectionKey: string
  icon: LucideIcon
  keywords: string[]
  navGroup?: 'cli' | 'agents'
}

type DocsNavPageItem = {
  type: 'page'
  pageId: DocsPageId
}

type DocsNavGroupItem = {
  type: 'group'
  id: string
  titleKey: string
  pageIds: DocsPageId[]
}

export type FilteredDocsNavItem =
  | {
      type: 'page'
      page: DocsPage
    }
  | {
      type: 'group'
      id: string
      title: string
      pages: DocsPage[]
    }

const DOCS_PAGE_DEFINITIONS: Record<DocsPageId, DocsPageDefinition> = {
  overview: {
    markdownName: 'overview',
    sectionKey: 'docs.sections.gettingStarted',
    icon: BookCopy,
    keywords: ['overview', 'gateway', 'api key', 'base url'],
  },
  quickstart: {
    markdownName: 'quickstart',
    sectionKey: 'docs.sections.gettingStarted',
    icon: Rocket,
    keywords: ['quickstart', 'curl', 'models', 'base url'],
  },
  'cli-overview': {
    markdownName: 'cli-overview',
    sectionKey: 'docs.sections.cliAgents',
    icon: BookCopy,
    keywords: ['cli', 'terminal', 'environment', 'config'],
    navGroup: 'cli',
  },
  'codex-cli': {
    markdownName: 'codex-cli',
    sectionKey: 'docs.sections.cliAgents',
    icon: Command,
    keywords: ['codex', 'config.toml', 'openai compatible', 'llmg api key'],
    navGroup: 'cli',
  },
  'claude-code-cli': {
    markdownName: 'claude-code-cli',
    sectionKey: 'docs.sections.cliAgents',
    icon: Bot,
    keywords: ['claude code', 'anthropic', 'messages', 'anthropic base url'],
    navGroup: 'cli',
  },
  'opencode-cli': {
    markdownName: 'opencode-cli',
    sectionKey: 'docs.sections.cliAgents',
    icon: Box,
    keywords: ['opencode', 'jsonc', 'provider', 'baseurl'],
    navGroup: 'cli',
  },
  'vscode-extension': {
    markdownName: 'vscode-extension',
    sectionKey: 'docs.sections.editorIntegration',
    icon: AppWindow,
    keywords: ['vscode', 'extension', 'codex', 'openai.chatgpt'],
  },
  'api-reference': {
    markdownName: 'api-reference',
    sectionKey: 'docs.sections.reference',
    icon: SquareTerminal,
    keywords: ['api', 'reference', 'chat completions', 'messages', 'models'],
  },
  'agents-overview': {
    markdownName: 'agents-overview',
    sectionKey: 'docs.sections.agents',
    icon: Bot,
    keywords: ['agents', 'runtime', 'yaml', 'custom provider', 'hermes'],
    navGroup: 'agents',
  },
  'hermes-agent': {
    markdownName: 'hermes-agent',
    sectionKey: 'docs.sections.agents',
    icon: Bot,
    keywords: ['hermes', 'nous research', 'config.yaml', 'custom provider', 'llmg api key'],
    navGroup: 'agents',
  },
}

const DOCS_NAV_ITEMS: Array<DocsNavPageItem | DocsNavGroupItem> = [
  { type: 'page', pageId: 'overview' },
  { type: 'page', pageId: 'quickstart' },
  {
    type: 'group',
    id: 'cli',
    titleKey: 'docs.groups.cliAgents',
    pageIds: ['cli-overview', 'codex-cli', 'claude-code-cli', 'opencode-cli'],
  },
  {
    type: 'group',
    id: 'agents',
    titleKey: 'docs.groups.agents',
    pageIds: ['agents-overview', 'hermes-agent'],
  },
  { type: 'page', pageId: 'vscode-extension' },
  { type: 'page', pageId: 'api-reference' },
]

export const DOCS_ORDER: DocsPageId[] = DOCS_NAV_ITEMS.flatMap((item) =>
  item.type === 'page' ? [item.pageId] : item.pageIds
)

export const FEATURED_DOC_IDS: DocsPageId[] = [
  'quickstart',
  'codex-cli',
  'vscode-extension',
]

export function resolveDocsLocale(language?: string): DocsLocale {
  return language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function getDocsPages(
  t: TFunction,
  language?: string
): Record<DocsPageId, DocsPage> {
  const locale = resolveDocsLocale(language)

  return Object.fromEntries(
    DOC_PAGE_IDS.map((pageId) => {
      const definition = DOCS_PAGE_DEFINITIONS[pageId]

      return [
        pageId,
        {
          id: pageId,
          title: t(`docs.pages.${pageId}.title`),
          summary: t(`docs.pages.${pageId}.summary`),
          description: t(`docs.pages.${pageId}.description`),
          sectionTitle: t(definition.sectionKey),
          markdownPath: `/docs-content/${locale}/${definition.markdownName}.md`,
          updatedAt: '2026-05-11',
          icon: definition.icon,
          keywords: definition.keywords,
          navGroup: definition.navGroup,
        } satisfies DocsPage,
      ]
    })
  ) as Record<DocsPageId, DocsPage>
}

export function getDocSearch(pageId: DocsPageId) {
  if (pageId === 'overview') {
    return {}
  }

  return { page: pageId }
}

export function getDocsPage(
  pages: Record<DocsPageId, DocsPage>,
  pageId?: DocsPageId
) {
  return pages[pageId ?? 'overview']
}

export function getDocsNeighbors(
  pages: Record<DocsPageId, DocsPage>,
  pageId: DocsPageId
) {
  const currentIndex = DOCS_ORDER.indexOf(pageId)

  return {
    previous: currentIndex > 0 ? pages[DOCS_ORDER[currentIndex - 1]] : null,
    next:
      currentIndex >= 0 && currentIndex < DOCS_ORDER.length - 1
        ? pages[DOCS_ORDER[currentIndex + 1]]
        : null,
  }
}

export function isCliDocsPage(
  pages: Record<DocsPageId, DocsPage>,
  pageId: DocsPageId
) {
  return pages[pageId].navGroup === 'cli'
}

export function isAgentsDocsPage(
  pages: Record<DocsPageId, DocsPage>,
  pageId: DocsPageId
) {
  return pages[pageId].navGroup === 'agents'
}

function matchesPage(page: DocsPage, normalizedQuery: string) {
  const haystack = [
    page.title,
    page.summary,
    page.description,
    page.sectionTitle,
    ...page.keywords,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

export function filterDocsNav(
  pages: Record<DocsPageId, DocsPage>,
  query: string,
  t: TFunction
): FilteredDocsNavItem[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return DOCS_NAV_ITEMS.map((item) =>
      item.type === 'page'
        ? { type: 'page', page: pages[item.pageId] }
        : {
            type: 'group',
            id: item.id,
            title: t(item.titleKey),
            pages: item.pageIds.map((pageId) => pages[pageId]),
          }
    )
  }

  const results: FilteredDocsNavItem[] = []

  for (const item of DOCS_NAV_ITEMS) {
    if (item.type === 'page') {
      const page = pages[item.pageId]

      if (matchesPage(page, normalizedQuery)) {
        results.push({ type: 'page', page })
      }

      continue
    }

    const groupTitle = t(item.titleKey)
    const groupMatches = groupTitle.toLowerCase().includes(normalizedQuery)
    const filteredPages = item.pageIds
      .map((pageId) => pages[pageId])
      .filter((page) => groupMatches || matchesPage(page, normalizedQuery))

    if (filteredPages.length > 0) {
      results.push({
        type: 'group',
        id: item.id,
        title: groupTitle,
        pages: filteredPages,
      })
    }
  }

  return results
}