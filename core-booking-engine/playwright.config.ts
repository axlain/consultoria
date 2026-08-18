import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8000',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
})
