import { test, expect } from '@playwright/test'

test('las rutas de acceso conservan sus cabeceras de seguridad al variar mayúsculas', async ({ request }) => {
  for (const path of ['/auth/login', '/Auth/Login', '/auth/reset-password', '/AUTH/RESET-PASSWORD']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['referrer-policy'], path).toBe('no-referrer')
    expect(response.headers()['cache-control'], path).toContain('no-store')
  }
})


test('documentos, redirecciones y errores impiden enmarcado y caché compartida', async ({ request }) => {
  for (const path of ['/', '/auth/login', '/portal', '/operations/calendar', '/no-existe-security-test']) {
    const response = await request.get(path, { maxRedirects: 0 })
    const headers = response.headers()
    expect(headers['x-frame-options'], path).toBe('DENY')
    expect(headers['x-content-type-options'], path).toBe('nosniff')
    expect(headers['content-security-policy'], path).toContain("frame-ancestors 'none'")
    expect(headers['cache-control'], path).toContain('no-store')
  }
})

test('la política de scripts permite hidratar el acceso sin unsafe-inline', async ({ page }) => {
  const failures: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' && /content security policy|refused to execute|violates.*script-src/i.test(message.text())) failures.push(message.text())
  })
  const response = await page.goto('/auth/login')
  const policy = response?.headers()['content-security-policy'] || ''
  expect(policy).toContain("script-src 'self'")
  expect(policy.match(/script-src[^;]*/)?.[0]).not.toContain("'unsafe-inline'")
  await page.getByLabel('Correo electrónico', { exact: true }).fill('prueba@example.test')
  await page.getByLabel('Contraseña', { exact: true }).fill('Invalid123!')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled()
  expect(failures).toEqual([])
})
