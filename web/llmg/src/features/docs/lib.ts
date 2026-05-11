export type DocsHeading = {
  id: string
  title: string
  depth: 2 | 3
}

export function slugifyHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=[\]{}|;:'",.<>/?\\]/g, '')
    .replace(/\s+/g, '-')
}

function stripMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`>#-]/g, '')
    .trim()
}

export function extractDocsHeadings(markdown: string): DocsHeading[] {
  const lines = markdown.split(/\r?\n/)
  const headings: DocsHeading[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      continue
    }

    const match = /^(##|###)\s+(.+)$/.exec(line.trim())
    if (!match) {
      continue
    }

    const depth = match[1] === '##' ? 2 : 3
    const title = stripMarkdown(match[2])
    if (!title) {
      continue
    }

    headings.push({
      id: slugifyHeading(title),
      title,
      depth,
    })
  }

  return headings
}