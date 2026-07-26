import { test } from '@playwright/test';

test('inspect products admin page structure', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('grailsoffcl@gmail.com');
  await page.locator('input[type="password"]').fill('grailsoffcl2226');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');

  await page.goto('/admin/products');
  await page.waitForURL('**/admin/products');
  await page.waitForLoadState('networkidle');

  const snapshot = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a')).map(el => ({ tag: el.tagName, text: el.textContent?.trim() || '' }));
    const links = Array.from(document.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href') || '', text: a.textContent?.trim() || '' }));
    return { buttons, links };
  });

  console.log('BUTTONS:', JSON.stringify(snapshot.buttons, null, 2));
  console.log('LINKS:', JSON.stringify(snapshot.links, null, 2));

  await page.screenshot({ path: 'test-results/products-admin.png', fullPage: true });
});