# Draw with Me

An offline-capable progressive web app (PWA) with step-by-step drawing lessons for kids aged 5-8. Each lesson is an SVG animation that draws a picture stroke by stroke, with a female voice-over. Built mainly for iPhone, installed to the Home Screen.

## Status

| Milestone | State |
| --- | --- |
| 1. Installable offline shell (React, Vite, Workbox) | Done |
| 2. Lesson engine: stroke animation, player controls, one sample lesson | Done |
| 3. Five sample lessons with Piper voice-over | Done |
| 4. Home screen with categories and progress stars | Next |
| 5. Remaining lessons (50 total) | Planned |
| 6. iPhone polish, optional draw-along canvas | Planned |
| 7. Deploy to a static HTTPS host | Planned |

All five lessons have a voice-over (Piper, en_GB-alba-medium) as an m4a file, and playback follows the audio clock. The audio-synced path has not yet been tested in a browser or on an iPhone.

## Requirements

- Node.js 20 or newer (developed on 22)
- npm

## Commands

```bash
npm install
npm run dev        # dev server (service worker is not active in dev)
npm run build      # type-check and production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

`npm install` may need `--legacy-peer-deps` because of a Babel peer-dependency conflict between `@vitejs/plugin-react` and `vite-plugin-pwa`.

### Smoke test

With `npm run preview` running in one terminal:

```bash
npx playwright install chromium   # first time only
node tools/check-player.mjs <output-folder>
```

It plays lesson 01 at iPhone size, checks step-by-step mode, reloads offline, and saves `mid.png` and `final.png` screenshots to the folder. It takes about a minute.

### Generating a voice-over

Needs Piper (a Python venv with `piper-tts`), the voice model files in one folder, and ffmpeg for m4a output:

```bash
node tools/make-voice.mjs 01 [--piper-env DIR] [--voices DIR] [--voice NAME]
```

Defaults: `~/piper-env`, `~/piper-voices`, `en_GB-alba-medium`. Set `FFMPEG` to the ffmpeg binary if it is not on PATH; without ffmpeg a .wav is written instead. The script renders each step's narration, places it at the step start, lengthens any step shorter than its narration (plus 0.7 s), rewrites the lesson's `start`/`end` times and sets `audio`. Re-run it after editing narration.

### Regenerating icons

```bash
node tools/make-icons.mjs
```

Renders `public/icon.svg` into `icon-192.png`, `icon-512.png` and `apple-touch-icon.png`.

## How lessons work

A lesson is a JSON file in `public/lessons/` (for example `01.json`), listed in `public/lessons/index.json`. A lesson has steps, and each step has narration text, a start and end time in seconds, and a list of SVG paths:

```json
{
  "id": "01",
  "title": "8 becomes a Snowman",
  "category": "Characters",
  "viewBox": "0 0 400 600",
  "audio": "01.m4a",
  "steps": [
    {
      "narration": "Let's draw a big number 8!",
      "start": 0,
      "end": 8,
      "paths": [
        { "d": "M125 220a75 75 0 1 0 150 0a75 75 0 1 0 -150 0", "stroke": "#023047" }
      ]
    }
  ]
}
```

- **Paths with `stroke`** are drawn on, one after another, sharing the step's time equally. Optional `width` defaults to 6.
- **Paths with `fill` and no `stroke`** fade in. They are rendered in a layer under the outlines, so colouring never covers the lines. A path with both fills once its stroke is complete.
- **`audio`** is optional. With it, the animation follows the audio element's clock, so step times should match the voice-over. Without it, a timer drives playback.
- Lessons are not limited to numbers or animals. Any starting shape and any picture works.

To add a lesson, create `public/lessons/NN.json` and add an entry to `index.json`. No code changes are needed.

## Project layout

```
public/
  lessons/            lesson JSON, m4a audio, index.json
  icon.svg, icon-*.png, apple-touch-icon.png
src/
  main.tsx            entry, HashRouter, service worker registration
  App.tsx             routes
  pages/              Home, LessonPage
  components/         LessonCanvas (SVG animator), Controls
  hooks/              useLessonPlayer (timeline, audio/timer clock, step mode)
  lib/                types.ts, lessons.ts (loading)
tools/
  make-icons.mjs      icon generation
  make-voice.mjs      Piper voice-over + step timings for a lesson
  check-player.mjs    Playwright smoke test
vite.config.ts        PWA manifest and Workbox config
```

## Offline and iPhone notes

- Everything under `dist/` (app code and lesson files) is precached by the service worker, so the app works offline after the first load.
- On iPhone, install it from Safari: Share, then Add to Home Screen. Installed apps are not subject to Safari's 7-day storage cleanup for unused sites.
- Audio can only start after a tap, so each lesson starts with a Play button.
- Service workers need HTTPS (localhost is exempt), so the app must be hosted before it can be installed on a phone.

## Planned tooling

A build script will turn `content/lessons.yaml` into lesson files and generate the voice-over with Piper TTS (free, local, female voice) and ffmpeg.

## Known issues

`npm audit` reports vulnerabilities in `workbox-build` (through `deepmerge`). They affect only the build tooling, not the shipped app. The suggested fix downgrades `vite-plugin-pwa`.
