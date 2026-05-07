import { test, expect } from './fixtures';

test('admin: criar mesa → editar → conflito de número → desativar', async ({ page }) => {
  await page.goto('/admin/mesas');
  await expect(page.getByRole('heading', { name: /mesas da loja/i })).toBeVisible();
  await expect(page.getByText(/sem mesas cadastradas/i)).toBeVisible();

  // Cria mesa 1 com capacidade 4 (default)
  await page.locator('input[name="numero"]').first().fill('1');
  await page.getByRole('button', { name: /\+ adicionar mesa/i }).click();
  await expect(page.getByText(/mesa criada/i)).toBeVisible();

  // Mesa aparece com badge "01"
  await expect(page.getByText('01').first()).toBeVisible();

  // Cria mesa 2 com capacidade 6
  const numeroInput = page.locator('input[name="numero"]').first();
  const capInput = page.locator('input[name="capacidade"]').first();
  await numeroInput.fill('2');
  await capInput.fill('6');
  await page.getByRole('button', { name: /\+ adicionar mesa/i }).click();
  await expect(page.getByText(/mesa criada/i)).toBeVisible();
  await expect(page.getByText('02').first()).toBeVisible();

  // Conflito: tentar criar mesa 1 de novo → erro toast
  await page.locator('input[name="numero"]').first().fill('1');
  await page.getByRole('button', { name: /\+ adicionar mesa/i }).click();
  await expect(page.getByText(/mesa 1 já existe/i)).toBeVisible();

  // Desativa mesa 1
  await page.getByRole('button', { name: 'desativar' }).first().click();
  await expect(page.getByRole('button', { name: 'ativar' }).first()).toBeVisible();
});
