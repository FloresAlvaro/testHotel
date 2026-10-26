import { test, expect } from '@playwright/test'

test('sin enlace de recuperación orienta a solicitar otro sin pedir contraseña', async ({ page }) => {
  await page.goto('/auth/reset-password')
  await expect(page.getByText('Falta el enlace de recuperación.', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Nueva contraseña', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Guardar contraseña' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Solicitar otro enlace' }).click()
  await expect(page).toHaveURL(/\/auth\/forgot-password$/)
})


test('un enlace inexistente no pide contraseña y permite solicitar otro',async({page})=>{
 await page.goto('/auth/reset-password?token='+ 'b'.repeat(64))
 await expect(page.getByText('El enlace no es válido, ya se usó o venció. Solicita uno nuevo.')).toBeVisible()
 await expect(page.getByLabel('Nueva contraseña',{exact:true})).toHaveCount(0)
 await expect(page).toHaveURL(/\/auth\/reset-password$/)
})

test('solicitud de acceso ofrece los canales de recepción sin enviar mensajes',async({page})=>{
 await page.goto('/auth/register')
 await expect(page.getByRole('link',{name:/Llamar a recepción/})).toHaveAttribute('href',/^tel:/)
 await expect(page.getByRole('link',{name:/Escribir a recepción/})).toHaveAttribute('href',/^mailto:/)
})
