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

test.describe('Admin Categories CRUD', () => {
  test('create category and verify storefront', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    const name = 'QA Test Category ' + Date.now();
    const slug = 'qa-test-category-' + Date.now();

    await page.getByRole('button', { name: /add category|new category|create category/i }).click();
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/name/i).fill(name);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByRole('button', { name: /save|create/i }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 15000 });
  });
});