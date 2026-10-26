export default defineEventHandler((event) => {
  if (!event.path.startsWith('/_nuxt/') && !event.path.startsWith('/_ipx/')) setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeaders(event, {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  })
})
