import { test } from '@playwright/test';

test('inspect product editor page elements', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').fill('grailsoffcl@gmail.com');
  await page.locator('input[type="password"]').fill('grailsoffcl2226');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin');

  await page.goto('/admin/products/new');
  await page.waitForURL('**/admin/products/new');
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  console.log('CURRENT_URL:', currentUrl);

  const snapshot = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map(h => ({ tag: h.tagName, text: h.textContent?.trim() || '' }));
    const labels = Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim() || '');
    const selects = Array.from(document.querySelectorAll('select')).map(s => ({ name: s.getAttribute('name') || '', options: Array.from(s.options).map(o => o.value) }));
    return { headings, labels, selects };
  });

  console.log('HEADINGS:', JSON.stringify(snapshot.headings, null, 2));
  console.log('LABELS:', JSON.stringify(snapshot.labels, null, 2));
  console.log('SELECTS:', JSON.stringify(snapshot.selects, null, 2));

  await page.screenshot({ path: 'test-results/product-editor.png', fullPage: true });
});