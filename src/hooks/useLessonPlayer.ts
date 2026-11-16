import { useCallback, useEffect, useRef, useState } from 'react'
import { lessonAudioUrl } from '../lib/lessons'
import type { Lesson } from '../lib/types'

const EPS = 0.01

/**
 * Drives a lesson's timeline. The clock is the audio element when the lesson has
 * voice-over, otherwise a requestAnimationFrame timer, so the animation stays in sync
 * with the voice.
 *
 * In step mode playback pauses at the end of each step; the paused time then equals the
 * next step's start, so `stepIndex` already names the step that is coming up.
 */
export function useLessonPlayer(lesson: Lesson) {
  const { steps } = lesson
  const duration = steps.at(-1)?.end ?? 0

  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [stepMode, setStepMode] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clock = useRef({ t: 0, last: 0 })
  const pauseAt = useRef<number | null>(steps[0]?.end ?? null)

  useEffect(() => {
    if (!lesson.audio) return
    const audio = new Audio(lessonAudioUrl(lesson.audio))
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [lesson.audio])

  useEffect(() => {
    if (!playing) return
    const audio = audioRef.current
    clock.current.last = performance.now()
    if (audio) audio.play().catch(() => setPlaying(false))

    let raf = 0
    const tick = (now: number) => {
      let t: number
      if (audio) {
        t = audio.currentTime
      } else {
        t = clock.current.t + (now - clock.current.last) / 1000
        clock.current.last = now
      }
      const stop = pauseAt.current ?? duration
      const done = t >= stop - EPS || (audio?.ended ?? false)
      if (done) t = Math.min(stop, duration)
      clock.current.t = t
      setTime(t)
      if (done) setPlaying(false)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      audio?.pause()
    }
  }, [playing, duration])

  const seek = useCallback((t: number) => {
    clock.current.t = t
    if (audioRef.current) audioRef.current.currentTime = t
    setTime(t)
  }, [])

  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => time < s.end - EPS) === -1
      ? steps.length - 1
      : steps.findIndex((s) => time < s.end - EPS),
  )

  const play = useCallback(() => {
    let from = clock.current.t
    if (from >= duration - EPS) {
      from = 0
      seek(0)
    }
    const current = steps.find((s) => from < s.end - EPS)
    pauseAt.current = stepMode && current ? current.end : null
    setPlaying(true)
  }, [duration, seek, stepMode, steps])

  const pause = useCallback(() => setPlaying(false), [])

  const replay = useCallback(() => {
    seek(0)
    pauseAt.current = stepMode && steps[0] ? steps[0].end : null
    setPlaying(true)
  }, [seek, stepMode, steps])

  /** Step mode: continue to the next step. Otherwise: skip ahead to it. */
  const next = useCallback(() => {
    if (!stepMode) {
      const target = steps.find((s) => s.start > clock.current.t + EPS)
      if (!target) return
      seek(target.start)
      pauseAt.current = null
      setPlaying(true)
      return
    }
    play()
  }, [play, seek, stepMode, steps])

  const changeStepMode = useCallback(
    (on: boolean) => {
      setStepMode(on)
      const current = steps.find((s) => clock.current.t < s.end - EPS)
      pauseAt.current = on && current ? current.end : null
    },
    [steps],
  )

  return {
    time,
    duration,
    playing,
    stepMode,
    stepIndex,
    finished: time >= duration - EPS,
    play,
    pause,
    replay,
    next,
    setStepMode: changeStepMode,
  }
}
