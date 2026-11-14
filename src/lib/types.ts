/** A single SVG path. With `stroke` it is drawn on; without it, `fill` fades in. */
export interface LessonPath {
  d: string
  stroke?: string
  fill?: string
  width?: number
}

/** Paths in a step share the step's time span equally, in order. Times are seconds. */
export interface LessonStep {
  narration: string
  start: number
  end: number
  paths: LessonPath[]
}

export interface Lesson {
  id: string
  title: string
  category: string
  viewBox: string
  /** Voice-over file inside public/lessons/. Without it, a timer drives playback. */
  audio?: string
  steps: LessonStep[]
}

export interface LessonSummary {
  id: string
  title: string
  category: string
}
