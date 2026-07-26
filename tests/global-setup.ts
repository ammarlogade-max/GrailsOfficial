import { type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Collect admin credentials from env or use defaults
  return;
}

export default globalSetup;