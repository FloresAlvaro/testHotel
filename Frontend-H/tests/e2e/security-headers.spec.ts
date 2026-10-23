import { test, expect } from '@playwright/test'

test('las rutas de acceso conservan sus cabeceras de seguridad al variar mayúsculas', async ({ request }) => {
  for (const path of ['/auth/login', '/Auth/Login', '/auth/reset-password', '/AUTH/RESET-PASSWORD']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['referrer-policy'], path).toBe('no-referrer')
    expect(response.headers()['cache-control'], path).toContain('no-store')
  }
})
