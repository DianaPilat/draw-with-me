# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Draw with Me": an installable PWA (React 19 + Vite + TypeScript, react-router) that plays step-by-step drawing lessons for kids. Lessons are SVG paths that animate on, synced to narration.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc && vite build` (type-check is part of the build; the tsconfig is strict with `noUnusedLocals`/`noUnusedParameters`)
- `npm run preview` — serve the production build at http://localhost:4173 (the service worker only exists in a build)
- `node tools/check-player.mjs [outDir]` — Playwright smoke test; requires `npm run preview` running. Plays lesson 01, saves screenshots, checks step mode, reloads offline.
- `node tools/make-icons.mjs` — regenerates the PNG icons in `public/` from `public/icon.svg` (sharp)

There is no linter or unit-test framework.

## Architecture

**Lessons are data, not code.** Each lesson is a JSON file in `public/lessons/<id>.json`, listed in `public/lessons/index.json` (both must be updated when adding a lesson). Types are in `src/lib/types.ts`; they are fetched at runtime via `src/lib/lessons.ts` (relative to `BASE_URL`). An optional `audio` field names a voice-over file in `public/lessons/`.

**Timeline model.** Each step has `start`/`end` seconds, and its `paths` split that span equally, drawn in order. Step times should be contiguous (one step's `end` = the next's `start`); total duration is the last step's `end`.

**Playback (`src/hooks/useLessonPlayer.ts`)** owns all timing. The clock is the `<audio>` element's `currentTime` when the lesson has audio, otherwise a `requestAnimationFrame` timer, so animation stays in sync with the voice. It exposes `time`, which `LessonCanvas` renders purely as a function of time (so seeking/replay need no animation state). In step mode it sets `pauseAt` to the current step's `end`; the paused time then equals the next step's start, so `stepIndex` already names the upcoming step.

**Rendering (`src/components/LessonCanvas.tsx`).** Stroked paths animate via `stroke-dashoffset` with `pathLength=1`. Fills sit in a separate lower `<g>` so they never cover outlines: a path with both stroke and fill fades its fill in only once the stroke is fully drawn; a fill-only path fades in over its slice. Within the fill layer, fill-only paths are drawn first and stroke+fill paths above them, so detail fills (eyes, spots) aren't covered by a later body colour.

**PWA/offline.** `vite.config.ts` configures `vite-plugin-pwa` (autoUpdate, precaches `**/*.{js,css,html,svg,png,json,m4a,woff2}`, so lesson JSON and audio are available offline). Routes use `HashRouter` (so URLs look like `/#/lesson/01`, which works offline without server rewrites): `/` (Home, lesson list) and `/lesson/:id` (LessonPage).
