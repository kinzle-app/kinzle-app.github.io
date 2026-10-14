// Testy klíčových průchodů hrou v mobilním rozlišení (Playwright).
// Lokálně na Windows jen Chromium (WebKit tam potřebuje chybějící systémové knihovny),
// na GitHubu (Linux) i WebKit jako iPhone.
import { defineConfig, devices } from '@playwright/test';

const projects = [{ name: 'android', use: { ...devices['Pixel 7'] } }];
if (process.platform !== 'win32') projects.push({ name: 'iphone', use: { ...devices['iPhone 13'] } });

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4319/' },
  projects,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4319 --strictPort',
    url: 'http://localhost:4319/',
    reuseExistingServer: false // vždy čerstvě sestavená verze
  }
});
