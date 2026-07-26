import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'grailsoffcl@gmail.com';
const ADMIN_PASSWORD = 'grailsoffcl2226';

async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');
}

test.describe('Admin to Storefront verification', () => {
  test('create product and verify across storefront', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/products');
    await page.waitForURL('**/admin/products');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /add new product|new product/i }).click();
    await page.waitForURL('**/admin/products/new');

    const uniqueName = 'QA Product ' + Date.now();
    const slug = 'qa-product-' + Date.now();
    const shortDescription = 'QA short description';

    await page.locator('label:has-text("Product Name") + input').fill(uniqueName);
    await page.locator('label:has-text("Brand") + input').fill('QA Brand');
    await page.locator('label:has-text("Selling Price (₹)") + input').fill('149.99');
    await page.locator('label:has-text("Stock Quantity") + input').fill('100');
    await page.locator('label:has-text("Status") + select').selectOption('published');

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
});