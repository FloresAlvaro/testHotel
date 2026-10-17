import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./tests/e2e', fullyParallel:false, workers:1, timeout:60000,
  use:{actionTimeout:10000,baseURL:process.env.E2E_BASE_URL||'http://localhost:3311',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure',...(process.env.E2E_BROWSER==='chromium'?{}:{channel:'chrome'})},
  reporter:'list',
})
