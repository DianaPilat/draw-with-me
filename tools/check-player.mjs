// Smoke test against `npm run preview` (http://localhost:4173): plays lesson 01,
// screenshots mid/final frames, checks step mode, then reloads offline.
import { chromium } from 'playwright'

const url = 'http://localhost:4173/'
const out = process.argv[2] ?? '.'
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const check = (name, ok) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
const drawn = () =>
  page.$$eval('svg.canvas g[fill="none"] path', (ps) =>
    ps.filter((p) => p.getAttribute('stroke-dashoffset') === '0').length,
  )

await page.goto(url)
await page.getByRole('link', { name: /Snowman/ }).click()
await page.waitForSelector('svg.canvas')
check('lesson page renders', (await page.title()) === 'Draw with Me')

await page.getByRole('button', { name: 'Play' }).click()
await page.waitForTimeout(14000)
await page.screenshot({ path: `${out}/mid.png` })
const mid = await drawn()
check(`mid-play: some but not all paths drawn (${mid})`, mid > 2 && mid < 18)

await page.getByRole('button', { name: 'Start over' }).click()
await page.getByRole('button', { name: 'Pause' }).click()
await page.waitForTimeout(200)

// Step mode: should stop after step 1 (2 paths) on its own.
await page.getByLabel('One step at a time').check()
await page.getByRole('button', { name: 'Start over' }).click()
await page.waitForTimeout(9500)
const afterStep1 = await drawn()
check(`step mode stops after step 1 (${afterStep1} paths drawn)`, afterStep1 === 2)
check('caption now shows next step', (await page.locator('.caption').textContent()).includes('hat'))
await page.getByRole('button', { name: 'Next step' }).click()
await page.waitForTimeout(6500)
check(`step 2 drew hat (${await drawn()} paths)`, (await drawn()) === 4)

// Untick step mode, skip to end by playing through.
await page.getByLabel('One step at a time').uncheck()
await page.getByRole('button', { name: 'Play' }).click()
await page.waitForTimeout(34000)
await page.screenshot({ path: `${out}/final.png` })
check(`final: all strokes drawn (${await drawn()})`, (await drawn()) === 18)
check('play button returns at the end', await page.getByRole('button', { name: 'Play' }).isVisible())

// Offline reload
await page.waitForTimeout(1500)
await context.setOffline(true)
await page.reload()
await page.waitForSelector('svg.canvas')
check('lesson loads offline', true)
await page.goto(url + '#/')
await page.waitForSelector('.card')
check('home loads offline', true)

check(`no console/page errors${errors.length ? ': ' + errors.join(' | ') : ''}`, errors.length === 0)
await browser.close()
