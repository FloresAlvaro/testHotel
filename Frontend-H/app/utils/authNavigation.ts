import type { UserRole } from '~/types'
export const postLoginPath = (role: UserRole | undefined, requested?: unknown): string => {
  const home = role === 'customer' ? '/portal' : '/dashboard'
  if (typeof requested !== 'string' || !requested.startsWith('/') || requested.startsWith('//') || requested.includes('\\')) return home
  const path = requested.split(/[?#]/)[0] || ''
  const portal = path === '/portal' || path.startsWith('/portal/')
  if (path.startsWith('/auth') || (role === 'customer' ? !portal : portal)) return home
  return requested
}
