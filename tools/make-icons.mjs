// Renders public/icon.svg into the PNG icons the PWA manifest and iOS need.
import sharp from 'sharp'

const jobs = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of jobs) {
  await sharp('public/icon.svg').resize(size, size).png().toFile(`public/${name}`)
}
