// Renders the finished drawing of every lesson to public/lessons/thumbs/<id>.svg
// (same layering as LessonCanvas). Re-run after adding or changing a lesson.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const dir = new URL('../public/lessons/', import.meta.url)
const out = new URL('thumbs/', dir)
mkdirSync(out, { recursive: true })

const index = JSON.parse(readFileSync(new URL('index.json', dir), 'utf8'))
for (const { id } of index) {
  const lesson = JSON.parse(readFileSync(new URL(`${id}.json`, dir), 'utf8'))
  const paths = lesson.steps.flatMap((s) => s.paths)
  const fills = [
    ...paths.filter((p) => p.fill && !p.stroke),
    ...paths.filter((p) => p.fill && p.stroke),
  ]
  const strokes = paths.filter((p) => p.stroke)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${lesson.viewBox}">` +
    fills.map((p) => `<path d="${p.d}" fill="${p.fill}"/>`).join('') +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    strokes.map((p) => `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.width ?? 6}"/>`).join('') +
    `</g></svg>`
  writeFileSync(new URL(`${id}.svg`, out), svg)
}
console.log(`Wrote ${index.length} thumbnails`)
