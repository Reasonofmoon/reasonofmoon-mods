// Renders docs/src/*.html to docs/assets/*.png at 2x. Needs Playwright + Chromium.
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
// Resolve Playwright from the project or, failing that, the global install.
const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = require(execSync('npm root -g').toString().trim() + '/playwright') }
const { chromium } = playwright
import { readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const src = 'docs/src', out = 'docs/assets'
const sizes = { 'hero.html': [1600, 600], 'pipeline.html': [1600, 410] }
const browser = await chromium.launch()
for (const file of readdirSync(src).filter(f => f.endsWith('.html'))) {
  const [width, height] = sizes[file] ?? [1600, 600]
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
  await page.goto('file://' + join(process.cwd(), src, file))
  await page.screenshot({ path: join(out, basename(file, '.html') + '.png') })
  await page.close()
}
await browser.close()
