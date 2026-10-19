import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('apps/desktop/dist', 'dist', { recursive: true });
