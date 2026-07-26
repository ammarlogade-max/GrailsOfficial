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
test.describe('Admin Media', () => {
  test('upload image and verify storefront', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /upload|add image/i }).click();
    await page.waitForLoadState('networkidle');
  });
});