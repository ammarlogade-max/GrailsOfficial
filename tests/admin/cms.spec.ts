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
test.describe('Admin CMS', () => {
  test('update homepage hero and verify storefront', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/homepage');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/headline/i).fill('QA Test Hero');
    await page.getByRole('button', { name: /save/i }).click();
    await page.goto('/');
    await expect(page.getByText('QA Test Hero')).toBeVisible({ timeout: 15000 });
  });
});