import type { Lesson, LessonPath } from '../lib/types'

interface Props {
  lesson: Lesson
  /** Seconds into the lesson. Infinity renders the finished picture. */
  time: number
}

interface Timed {
  key: string
  path: LessonPath
  /** 0 = not started, 1 = fully drawn */
  progress: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

function timedPaths(lesson: Lesson, time: number): Timed[] {
  return lesson.steps.flatMap((step, si) => {
    const slice = (step.end - step.start) / step.paths.length
    return step.paths.map((path, pi) => ({
      key: `${si}-${pi}`,
      path,
      progress: clamp01((time - (step.start + pi * slice)) / slice),
    }))
  })
}

/**
 * Outlines are drawn with a stroke-dashoffset animation (pathLength is normalised to 1).
 * Fills live in a lower layer so colouring never covers the outlines.
 */
export default function LessonCanvas({ lesson, time }: Props) {
  const paths = timedPaths(lesson, time)
  const fills = paths.filter((p) => p.path.fill)
  const strokes = paths.filter((p) => p.path.stroke)
  const [, , w, h] = lesson.viewBox.split(' ').map(Number)

  return (
    <svg
      className="canvas"
      viewBox={lesson.viewBox}
      style={{ aspectRatio: `${w} / ${h}`, width: `min(100%, calc(55dvh * ${w / h}))` }}
      role="img"
      aria-label={lesson.title}
    >
      <g>
        {fills.map(({ key, path, progress }) => (
          <path
            key={key}
            d={path.d}
            fill={path.fill}
            opacity={path.stroke ? (progress >= 1 ? 1 : 0) : progress}
            className="fill"
          />
        ))}
      </g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {strokes.map(({ key, path, progress }) => (
          <path
            key={key}
            d={path.d}
            pathLength={1}
            stroke={path.stroke}
            strokeWidth={path.width ?? 6}
            strokeDasharray={1}
            strokeDashoffset={1 - progress}
            opacity={progress > 0 ? 1 : 0}
          />
        ))}
      </g>
    </svg>
  )
}
