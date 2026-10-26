import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

// Only the isolated prepare-e2e fixture has this secret. No bypass in the application.
export const fixtureMfaSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const backendRequire = createRequire(new URL('../../../Backend-H/package.json', import.meta.url));
const OTPAuth = backendRequire('otpauth') as {
  TOTP: new (options: { algorithm: string; digits: number; period: number; secret: unknown }) => { generate(): string };
  Secret: { fromBase32: (value: string) => unknown };
};
const usedCounters = new Map<string, number>();

export function otp(secret: string) {
  return new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) }).generate();
}
export async function freshOtp(secret = fixtureMfaSecret) {
  let counter = Math.floor(Date.now() / 30_000);
  while (counter <= (usedCounters.get(secret) ?? -1)) {
    await delay(Math.min(30_000, 30_000 - Date.now() % 30_000 + 50));
    counter = Math.floor(Date.now() / 30_000);
  }
  usedCounters.set(secret, counter);
  return otp(secret);
}

export async function loginApi(request: APIRequestContext, data: { email: string; password: string }): Promise<APIResponse> {
  const base = process.env.E2E_API_URL || 'http://localhost:3300/api';
  const response = await request.post(`${base}/users/login`, { data });
  if (response.status() !== 202) return response;
  const challenge = (await response.json()).data;
  expect(challenge.enrollmentRequired, 'El fixture admin debe estar inscrito por prepare-e2e').toBe(false);
  let result = await request.post(`${base}/users/mfa/verify`, {
    headers: { 'X-Hotel-Request': '1' }, data: { challengeId: challenge.challengeId, code: await freshOtp() },
  });
  // A previous file can have consumed this time step before this worker imported the helper.
  if (result.status() === 401) result = await request.post(`${base}/users/mfa/verify`, {
    headers: { 'X-Hotel-Request': '1' }, data: { challengeId: challenge.challengeId, code: await freshOtp() },
  });
  expect(result.ok(), 'La API requiere un segundo factor válido, sin bypass').toBe(true);
  return result;
}

export async function finishBrowserMfa(page: Page) {
  if (process.env.MFA_ENABLED !== 'true') return;
  const input = page.getByLabel('Código de 6 dígitos', { exact: true });
  const requiresMfa = await Promise.race([
    input.waitFor({ state: 'visible' }).then(() => true),
    page.waitForURL(url => !url.pathname.toLowerCase().startsWith('/auth/login')).then(() => false),
  ]);
  if (!requiresMfa) return;
  await input.fill(await freshOtp());
  await page.getByRole('button', { name: 'Verificar y entrar', exact: true }).click();
  const accepted = await Promise.race([
    page.waitForURL(url => !url.pathname.toLowerCase().startsWith('/auth/login')).then(() => true),
    page.getByRole('alert').filter({ hasText: /Código incorrecto|ya utilizado/ }).waitFor({ state: 'visible' }).then(() => false),
  ]);
  if (!accepted) {
    await input.fill(await freshOtp());
    await page.getByRole('button', { name: 'Verificar y entrar', exact: true }).click();
  }
}
