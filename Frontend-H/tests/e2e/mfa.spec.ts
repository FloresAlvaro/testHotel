import { test, expect } from '@playwright/test';
import { otp, loginApi } from './helpers';

test.skip(process.env.E2E_ALLOW_WRITES !== '1' || process.env.MFA_ENABLED !== 'true', 'Requiere PostgreSQL E2E aislado y MFA habilitado');
const password = 'Enrollment123!';
const api = process.env.E2E_API_URL || 'http://127.0.0.1:3300/api';

test('administrador: inscripción, recuperación y cambio de autenticador sin omitir MFA', async ({ page, context, request }) => {
  const email = `mfa-enroll-${Date.now()}@example.com`;
  const admin = await loginApi(request, { email: 'admin@hotel.com', password: 'Admin123!' });
  const created = await request.post(`${api}/users`, { headers: { Authorization: `Bearer ${(await admin.json()).data.token}` }, data: { name: 'MFA Enrollment', email, password, role: 'admin' } });
  expect(created.status()).toBe(201);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/admin/settings?tab=security');
  await expect(page.getByText('MFA desactivado', {exact:true})).toBeVisible();
  await page.locator('#mfa-enable-password').fill(password);
  await page.getByRole('button', {name:'Activar MFA',exact:true}).click();
  await expect(page.getByRole('heading', { name: 'Configura tu autenticador' })).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === 'hotel_session')).toBe(true);
  await page.getByRole('button', { name: 'Configurar autenticador', exact: true }).click();
  const secret = (await page.locator('code').textContent())!.trim();
  const recoveries = await page.getByRole('list', { name: 'Códigos de recuperación' }).getByRole('listitem').allTextContents();
  expect(recoveries).toHaveLength(10);
  await expect(page.getByRole('button', { name: 'Activar y entrar' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const qr=page.getByRole('img',{name:'Código QR para configurar el autenticador'})
  await expect(qr).toHaveAttribute('src',/^data:image\/png;base64,/)
  await expect.poll(()=>qr.evaluate(image=>image instanceof HTMLImageElement && image.complete && image.naturalWidth>0)).toBe(true)
  // No capturar la pantalla de inscripción: contiene claves y códigos de recuperación.
  await page.getByLabel(/He guardado los códigos/).check();
  await page.getByLabel('Código de 6 dígitos', { exact: true }).fill(otp(secret));
  await page.getByRole('button', { name: 'Activar y entrar' }).click();
  await expect(page.getByText('Autenticador configurado',{exact:true})).toBeVisible();
  await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();

  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'He perdido el acceso al autenticador' }).click();
  await page.getByLabel('Código de recuperación', { exact: true }).fill(recoveries[0]!.trim());
  await page.getByRole('button', { name: 'Verificar y entrar' }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto('/admin/settings?tab=security');
  await expect(page.getByText('Códigos de recuperación disponibles: 9.', { exact: false })).toBeVisible();
  await page.locator('#mfa-renew-password').fill(password);
  await page.getByLabel('Código del autenticador o de recuperación', { exact: true }).fill(recoveries[1]!.trim());
  await page.getByRole('button', { name: 'Configurar nuevo autenticador', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar autenticador', exact: true }).click();
  const newSecret = (await page.locator('code').textContent())!.trim();
  expect(newSecret).not.toBe(secret);
  const newCodes = await page.getByRole('list', { name: 'Códigos de recuperación' }).getByRole('listitem').allTextContents();
  await page.getByLabel(/He guardado los códigos/).check();
  await page.getByLabel('Código de 6 dígitos', { exact: true }).fill(otp(newSecret));
  await page.getByRole('button', { name: 'Activar y entrar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Autenticador actualizado' })).toBeVisible();
  await expect(page.getByText('Códigos de recuperación disponibles: 10.', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('mfaSecret'))).toBeNull();

  const pending = await request.post(`${api}/users/login`, { data: { email, password } });
  expect(pending.status()).toBe(202);
  const challengeId = (await pending.json()).data.challengeId;
  const oldRecovery = await request.post(`${api}/users/mfa/verify`, { headers: { 'X-Hotel-Request': '1' }, data: { challengeId, code: recoveries[2]!.trim() } });
  expect(oldRecovery.status()).toBe(401);
  const newRecovery = await request.post(`${api}/users/mfa/verify`, { headers: { 'X-Hotel-Request': '1' }, data: { challengeId, code: newCodes[0]!.trim() } });
  expect(newRecovery.ok()).toBe(true);
  expect((await newRecovery.json()).data.token).toBeTruthy();
  await page.locator('#mfa-renew-password').fill(password);
  await page.getByLabel('Código del autenticador o de recuperación', {exact:true}).fill(newCodes[1]!.trim());
  await page.getByRole('button', {name:'Desactivar MFA',exact:true}).click();
  await expect(page.getByText('MFA desactivado',{exact:true})).toBeVisible();
  const plainLogin=await request.post(`${api}/users/login`,{data:{email,password}});
  expect(plainLogin.status()).toBe(200);
  expect((await plainLogin.json()).data.token).toBeTruthy();
  expect(errors).toEqual([]);
});
