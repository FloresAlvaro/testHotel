import { createHash } from 'node:crypto'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (import.meta.dev) return
    // Only trust scripts emitted by the renderer in head/bodyAppend, never page body HTML.
    const hashes = new Set<string>()
    for (const fragment of [...html.head, ...html.bodyAppend]) {
      for (const match of fragment.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
        if (!/\bsrc\s*=/i.test(match[1] || '')) {
          hashes.add(`'sha256-${createHash('sha256').update(match[2] || '').digest('base64')}'`)
        }
      }
    }
    const apiUrl = new URL(useRuntimeConfig(event).public.apiBase)
    setResponseHeader(event, 'content-security-policy', [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      `script-src 'self' ${[...hashes].join(' ')}`,
      // Vue/Nuxt UI use dynamic inline styles (positioning, transitions and theme variables).
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://images.unsplash.com",
      "font-src 'self' data:",
      `connect-src 'self' ${apiUrl.origin}`,
    ].join('; '))
  })
})
