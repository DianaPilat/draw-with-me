import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Controls from '../components/Controls'
import DrawPad from '../components/DrawPad'
import FullscreenButton from '../components/FullscreenButton'
import LessonCanvas, { canvasSize } from '../components/LessonCanvas'
import { useLessonPlayer } from '../hooks/useLessonPlayer'
import { loadLesson } from '../lib/lessons'
import { markDone } from '../lib/progress'
import type { Lesson } from '../lib/types'

export default function LessonPage() {
  const { id = '' } = useParams()
  // The result is tagged with the id it was loaded for, so a stale or in-flight
  // result for another lesson is treated as "still loading".
  const [result, setResult] = useState<{ id: string; lesson: Lesson | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    loadLesson(id).then(
      (lesson) => !cancelled && setResult({ id, lesson }),
      () => !cancelled && setResult({ id, lesson: null }),
    )
    return () => {
      cancelled = true
    }
  }, [id])

  const current = result?.id === id ? result : null
  const lesson = current?.lesson ?? null
  const failed = current !== null && lesson === null

  if (failed) {
    return (
      <main className="page">
        <Link to="/" className="back">
          ← Back
        </Link>
        <p>Oops, we can't find that lesson.</p>
      </main>
    )
  }
  if (!lesson) return <main className="page" />
  return <Player key={lesson.id} lesson={lesson} />
}

function Player({ lesson }: { lesson: Lesson }) {
  const player = useLessonPlayer(lesson)
  const [drawAlong, setDrawAlong] = useState(false)

  useEffect(() => {
    if (player.finished) markDone(lesson.id)
  }, [player.finished, lesson.id])

  // Keep the screen on while a lesson plays.
  useEffect(() => {
    if (!player.playing || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    navigator.wakeLock.request('screen').then(
      (l) => {
        if (cancelled) l.release()
        else lock = l
      },
      () => {},
    )
    return () => {
      cancelled = true
      lock?.release().catch(() => {})
    }
  }, [player.playing])

  // Pause when the app goes to the background (home button, app switcher, locked phone).
  const { pause } = player
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) pause()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [pause])

  return (
    <main className={drawAlong ? 'page lesson draw-along' : 'page lesson'}>
      <Link to="/" className="back">
        ← Back
      </Link>
      <FullscreenButton />
      <h1>{lesson.title}</h1>
      <div className="stage">
        <LessonCanvas lesson={lesson} time={player.time} />
        {drawAlong && <DrawPad viewBox={lesson.viewBox} size={canvasSize(lesson.viewBox)} />}
        <Controls
          playing={player.playing}
          finished={player.finished}
          stepMode={player.stepMode}
          drawAlong={drawAlong}
          onDrawAlong={setDrawAlong}
          onPlay={player.play}
          onPause={player.pause}
          onReplay={player.replay}
          onNext={player.next}
          onStepMode={player.setStepMode}
        />
      </div>
    </main>
  )
}
