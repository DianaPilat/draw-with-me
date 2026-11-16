import { describe, expect, it } from 'vitest'
import type { Lesson, LessonSummary } from './types'

// Validates the shipped lesson content. Lessons are data, so a bad edit would otherwise
// only show up when a child opens that lesson.
const lessonFiles = import.meta.glob<Lesson>('../../public/lessons/[0-9]*.json', {
  eager: true,
  import: 'default',
})
const audioFiles = Object.keys(import.meta.glob('../../public/lessons/*.m4a'))
const index = Object.values(
  import.meta.glob<LessonSummary[]>('../../public/lessons/index.json', {
    eager: true,
    import: 'default',
  }),
)[0]

const lessons = Object.values(lessonFiles)

describe('lesson index', () => {
  it('lists 50 lessons with unique ids', () => {
    expect(index).toHaveLength(50)
    expect(new Set(index.map((l) => l.id)).size).toBe(index.length)
  })

  it('matches the lesson files one to one', () => {
    expect(lessons.map((l) => l.id).sort()).toEqual(index.map((l) => l.id).sort())
  })

  it('agrees with each lesson on title and category', () => {
    for (const entry of index) {
      const lesson = lessons.find((l) => l.id === entry.id)!
      expect(lesson.title, entry.id).toBe(entry.title)
      expect(lesson.category, entry.id).toBe(entry.category)
    }
  })
})

describe.each(lessons.map((l) => [l.id, l] as const))('lesson %s', (_id, lesson) => {
  it('has a well-formed viewBox', () => {
    const parts = lesson.viewBox.split(' ').map(Number)
    expect(parts).toHaveLength(4)
    expect(parts.every(Number.isFinite)).toBe(true)
    expect(parts[2]).toBeGreaterThan(0)
    expect(parts[3]).toBeGreaterThan(0)
  })

  it('has at least one step, each with paths and narration', () => {
    expect(lesson.steps.length).toBeGreaterThan(0)
    for (const step of lesson.steps) {
      expect(step.paths.length).toBeGreaterThan(0)
      expect(step.narration.trim()).not.toBe('')
    }
  })

  it('starts at 0 with contiguous, forward-moving step times', () => {
    expect(lesson.steps[0].start).toBe(0)
    lesson.steps.forEach((step, i) => {
      expect(step.end, `step ${i} end`).toBeGreaterThan(step.start)
      if (i > 0) expect(step.start, `step ${i} start`).toBeCloseTo(lesson.steps[i - 1].end, 5)
    })
  })

  it('gives every path geometry and something to draw', () => {
    for (const path of lesson.steps.flatMap((s) => s.paths)) {
      expect(path.d.trim()).not.toBe('')
      expect(Boolean(path.stroke || path.fill)).toBe(true)
      if (path.width !== undefined) expect(path.width).toBeGreaterThan(0)
    }
  })

  it('points at an audio file that exists', () => {
    if (!lesson.audio) return
    expect(audioFiles.some((f) => f.endsWith(`/${lesson.audio}`))).toBe(true)
  })
})
