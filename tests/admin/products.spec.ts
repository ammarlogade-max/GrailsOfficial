import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'grailsoffcl@gmail.com';
const ADMIN_PASSWORD = 'grailsoffcl2226';

async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
  await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');
}

test.describe('Admin Products CRUD', () => {
  test('create product and verify storefront', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/products/new');
    await page.waitForLoadState('networkidle');

    const timestamp = () => Date.now().toString();
    const uniqueName = `QA Test Product ${timestamp()}`;
    const slug = `qa-test-product-${timestamp()}`;
    const shortDescription = 'QA test short description';

    await page.getByLabel(/name/i).fill(uniqueName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByLabel(/short description/i).fill(shortDescription);
    await page.getByLabel(/price/i).fill('149.99');
    await page.getByLabel(/stock/i).fill('100');
    await page.getByLabel(/status/i).selectOption('active');

    await page.getByRole('button', { name: /save/i }).click();

    await page.waitForURL('**/admin/products');
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });

    await page.goto('/');
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });

    await page.goto('/products');
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });

    await page.goto(`/product/${slug}`);
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15000 });
  });

  test('edit product and verify storefront updates', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    const editButton = page.getByRole('row').filter({ hasText: /QA Test Product/ }).getByRole('button', { name: /edit/i });
    if (await editButton.count() === 0) {
      test.skip(true, 'No QA Test Product found to edit');
      return;
    }
    await editButton.first().click();
    await page.waitForLoadState('networkidle');

    const updatedName = `QA Updated Product ${Date.now()}`;
    await page.getByLabel(/name/i).fill(updatedName);
    await page.getByLabel(/price/i).fill('199.99');
    await page.getByRole('button', { name: /save/i }).click();

    await page.waitForURL('**/admin/products');
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 15000 });

    await page.goto('/products');
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 15000 });
  });

  test('delete product and verify removal from storefront', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    const deleteButtons = page.getByRole('row').filter({ hasText: /QA Test Product|QA Updated Product/ }).getByRole('button', { name: /delete/i });
    if (await deleteButtons.count() === 0) {
      test.skip(true, 'No QA product found to delete');
      return;
    }
    await deleteButtons.first().click();

    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.count() > 0) {
      await confirmButton.first().click();
    }

    await page.waitForURL('**/admin/products');
    await expect(page.getByText(/QA Test Product|QA Updated Product/)).toHaveCount(0, { timeout: 15000 });

    await page.goto('/products');
    await expect(page.getByText(/QA Test Product|QA Updated Product/)).toHaveCount(0, { timeout: 15000 });
  });
});
