export function applyFaviconToDom(url: string) {
  if (typeof document === 'undefined' || !url) return
  try {
    const next = new URL(url, window.location.href).href
    const existing =
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    if (
      existing.length >= 1 &&
      Array.from(existing).every((link) => link.href === next)
    ) {
      return
    }
    existing.forEach((l) => l.remove())

    const primary = document.createElement('link')
    primary.rel = 'icon'
    primary.href = url
    document.head.appendChild(primary)

    const shortcut = document.createElement('link')
    shortcut.rel = 'shortcut icon'
    shortcut.href = url
    document.head.appendChild(shortcut)
  } catch {
    // Ignore malformed URLs
  }
}
