// Renders a lesson's narration with Piper, lays each step's clip at its start
// time, writes public/lessons/<id>.{wav|m4a} and updates the lesson's timings.
//
// usage: node tools/make-voice.mjs <lessonId> [--piper-env DIR] [--voices DIR] [--voice NAME]
// m4a (needed for iPhone + precache) is produced only when ffmpeg is on PATH (or $FFMPEG);
// otherwise a .wav is written and `audio` points at it.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : def
}
const id = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
if (!id) throw new Error('usage: node tools/make-voice.mjs <lessonId>')

const home = process.env.USERPROFILE ?? process.env.HOME
const piperEnv = opt('--piper-env', join(home, 'piper-env'))
const voices = opt('--voices', join(home, 'piper-voices'))
const voice = opt('--voice', 'en_GB-alba-medium')
const piper = join(piperEnv, 'Scripts', 'piper.exe')

const PAD = 0.7 // seconds of breathing room after each narration
const lessonPath = join(root, 'public', 'lessons', `${id}.json`)
const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'))

const tmp = mkdtempSync(join(tmpdir(), 'voice-'))

function readWav(buf) {
  let p = 12
  let fmt
  while (p < buf.length) {
    const tag = buf.toString('ascii', p, p + 4)
    const size = buf.readUInt32LE(p + 4)
    if (tag === 'fmt ') {
      fmt = { channels: buf.readUInt16LE(p + 10), rate: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) }
    } else if (tag === 'data') {
      return { ...fmt, pcm: buf.subarray(p + 8, p + 8 + size) }
    }
    p += 8 + size + (size & 1)
  }
  throw new Error('bad wav')
}

const clips = lesson.steps.map((step, i) => {
  const out = join(tmp, `${i}.wav`)
  const r = spawnSync(
    piper,
    ['-m', join(voices, `${voice}.onnx`), '-c', join(voices, `${voice}.onnx.json`), '-f', out],
    { input: step.narration, encoding: 'utf8' },
  )
  if (r.status !== 0) throw new Error(`piper failed on step ${i}: ${r.stderr}`)
  return readWav(readFileSync(out))
})

const { rate, channels, bits } = clips[0]
const bytesPerSec = rate * channels * (bits / 8)
const frame = channels * (bits / 8)

// Keep each step at least as long as its drawing time, but never shorter than its narration.
let t = 0
const chunks = []
lesson.steps.forEach((step, i) => {
  const narr = clips[i].pcm.length / bytesPerSec
  const dur = Math.ceil(Math.max(step.end - step.start, narr + PAD) * 10) / 10
  const total = Math.round(dur * rate) * frame
  const buf = Buffer.alloc(total) // zeros = silence
  clips[i].pcm.copy(buf, 0, 0, Math.min(clips[i].pcm.length, total))
  chunks.push(buf)
  step.start = Math.round(t * 10) / 10
  t += dur
  step.end = Math.round(t * 10) / 10
})

const pcm = Buffer.concat(chunks)
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(channels, 22)
header.writeUInt32LE(rate, 24)
header.writeUInt32LE(bytesPerSec, 28)
header.writeUInt16LE(frame, 32)
header.writeUInt16LE(bits, 34)
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)

const wavPath = join(root, 'public', 'lessons', `${id}.wav`)
writeFileSync(wavPath, Buffer.concat([header, pcm]))

let audio = `${id}.wav`
const m4aPath = join(root, 'public', 'lessons', `${id}.m4a`)
const ff = spawnSync(process.env.FFMPEG ?? 'ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-c:a', 'aac', '-b:a', '64k', m4aPath])
if (ff.status === 0) {
  rmSync(wavPath)
  audio = `${id}.m4a`
} else {
  console.warn('ffmpeg not found: wrote WAV. Re-run after installing ffmpeg to get m4a.')
}

lesson.audio = audio
writeFileSync(lessonPath, JSON.stringify(lesson, null, 2) + '\n')
rmSync(tmp, { recursive: true, force: true })
console.log(`${audio}: ${t.toFixed(1)}s`, lesson.steps.map((s) => `${s.start}-${s.end}`).join(' '))
