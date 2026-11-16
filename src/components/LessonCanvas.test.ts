import { describe, expect, it } from 'vitest'
import type { Lesson } from '../lib/types'
import { canvasSize, timedPaths } from './LessonCanvas'

const stroke = (d: string) => ({ d, stroke: '#000' })

// Step 1: 0-4s with two paths (2s each). Step 2: 4-10s with one path.
const lesson: Lesson = {
  id: 't',
  title: 'Test',
  category: 'Test',
  viewBox: '0 0 400 600',
  steps: [
    { narration: 'a', start: 0, end: 4, paths: [stroke('M0 0'), stroke('M1 1')] },
    { narration: 'b', start: 4, end: 10, paths: [stroke('M2 2')] },
  ],
}

const progress = (time: number) => timedPaths(lesson, time).map((p) => p.progress)

describe('timedPaths', () => {
  it('draws nothing before the lesson starts', () => {
    expect(progress(0)).toEqual([0, 0, 0])
    expect(progress(-5)).toEqual([0, 0, 0])
  })

  it('splits a step equally between its paths, in order', () => {
    expect(progress(1)).toEqual([0.5, 0, 0])
    expect(progress(2)).toEqual([1, 0, 0])
    expect(progress(3)).toEqual([1, 0.5, 0])
  })

  it('starts the next step at the previous step end', () => {
    expect(progress(4)).toEqual([1, 1, 0])
    expect(progress(7)).toEqual([1, 1, 0.5])
  })

  it('shows the finished picture at the end and beyond', () => {
    expect(progress(10)).toEqual([1, 1, 1])
    expect(progress(Infinity)).toEqual([1, 1, 1])
  })

  it('is a pure function of time: seeking backwards gives the same result', () => {
    const forward = progress(3)
    progress(9)
    expect(progress(3)).toEqual(forward)
  })

  it('gives every path a unique key', () => {
    const keys = timedPaths(lesson, 0).map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('canvasSize', () => {
  it('derives the width from the viewBox aspect ratio', () => {
    expect(canvasSize('0 0 400 600')).toBe(`min(100%, calc(var(--canvas-h) * ${400 / 600}))`)
  })
})
