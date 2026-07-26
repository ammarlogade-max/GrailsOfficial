import { test, expect } from '@playwright/test';

test('diagnose admin login selectors', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  const info = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim() || '');
    const inputs = Array.from(document.querySelectorAll('input'));
    const placeholders = inputs.map(i => i.getAttribute('placeholder') || '');
    const types = inputs.map(i => i.getAttribute('type') || '');
    return { labels, placeholders, types };
  });

  console.log('LABELS:', JSON.stringify(info.labels, null, 2));
  console.log('PLACEHOLDERS:', JSON.stringify(info.placeholders, null, 2));
  console.log('TYPES:', JSON.stringify(info.types, null, 2));

  await page.screenshot({ path: 'test-results/admin-login.png', fullPage: true });
});
