import { test, expect } from './fixtures';

test('admin: criar categoria → criar produto → renomear → desativar/reativar', async ({ page }) => {
  await page.goto('/admin/cardapio');
  await expect(page.getByRole('heading', { name: /categorias/i })).toBeVisible();

  // Estado inicial: cardápio vazio
  await expect(page.getByText(/cardápio vazio/i)).toBeVisible();

  // Cria categoria
  await page.getByPlaceholder(/pizzas, bebidas/i).fill('Pizzas');
  await page.getByRole('button', { name: /adicionar/i }).click();

  // Toast de sucesso aparece
  await expect(page.getByText(/categoria criada/i)).toBeVisible();

  // Categoria aparece na lista — input dentro do <li> tem value "Pizzas"
  const categoryRowInput = page.locator('li input[name="nome"]').first();
  await expect(categoryRowInput).toHaveValue('Pizzas');

  // Entra em produtos da categoria
  await page.getByText(/0 produtos/i).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/pizzas/i);

  // Cria produto
  await page.getByPlaceholder(/nome do produto/i).fill('Margherita');
  await page.getByPlaceholder(/preço/i).fill('45.00');
  await page.getByRole('button', { name: /\+ adicionar/i }).click();
  await expect(page.getByText(/produto criado/i)).toBeVisible();
  await expect(page.locator('li input[name="nome"]').first()).toHaveValue('Margherita');

  // Volta pra lista, contador agora mostra 1 produto
  await page.goto('/admin/cardapio');
  await expect(page.getByText(/1 produto/i)).toBeVisible();

  // Renomeia categoria
  const nomeInput = page.locator('li input[name="nome"]').first();
  await nomeInput.fill('Pizzas Tradicionais');
  await nomeInput.press('Enter');
  await expect(page.getByText(/nome atualizado/i)).toBeVisible();

  // Desativa categoria
  await page.getByRole('button', { name: 'desativar' }).click();
  await expect(page.getByRole('button', { name: 'ativar' })).toBeVisible();
});
