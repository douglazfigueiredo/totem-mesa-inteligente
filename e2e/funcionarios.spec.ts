import { test, expect } from './fixtures';

test('admin: criar funcionário com PIN → regenerar PIN', async ({ page }) => {
  await page.goto('/admin/funcionarios');
  await expect(page.getByRole('heading', { name: /funcionários da operação/i })).toBeVisible();
  await expect(page.getByText(/sem funcionários cadastrados/i)).toBeVisible();

  // Cria funcionário "João" com role garcom
  await page.getByPlaceholder(/nome do funcionário/i).fill('João');
  await page.getByRole('checkbox', { name: 'garçom' }).first().check();
  await page.getByRole('button', { name: /\+ adicionar funcionário/i }).click();

  // Toast com PIN — formato "João criado · PIN: 4 dígitos"
  const toast = page.getByText(/joão criado · pin: \d{4}/i);
  await expect(toast).toBeVisible();
  const toastText = await toast.textContent();
  const pinMatch = toastText?.match(/PIN: (\d{4})/);
  expect(pinMatch).toBeTruthy();
  expect(pinMatch![1]).toMatch(/^\d{4}$/);

  // Funcionário aparece na lista — input dentro do <li> tem value "João"
  await expect(page.locator('li input[name="nome"]').first()).toHaveValue('João');

  // Regenera PIN
  await page.getByRole('button', { name: /regenerar PIN/i }).click();
  const newPinToast = page.getByText(/joão · novo pin: \d{4}/i);
  await expect(newPinToast).toBeVisible();
  const newToastText = await newPinToast.textContent();
  const newPinMatch = newToastText?.match(/novo PIN: (\d{4})/);
  expect(newPinMatch).toBeTruthy();
  // PIN provavelmente diferente (probabilidade colisão ~1/10000)
  // Não asserta != porque flaky; só valida que existe.
});
