import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Controls from '../components/Controls'
import DrawPad from '../components/DrawPad'
import LessonCanvas, { canvasSize } from '../components/LessonCanvas'
import { useLessonPlayer } from '../hooks/useLessonPlayer'
import { loadLesson } from '../lib/lessons'
import { markDone } from '../lib/progress'
import type { Lesson } from '../lib/types'

export default function LessonPage() {
  const { id = '' } = useParams()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLesson(null)
    setFailed(false)
    loadLesson(id).then(setLesson, () => setFailed(true))
  }, [id])

  if (failed) {
    return (
      <main className="page">
        <Link to="/" className="back">← Back</Link>
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
    <main className="page lesson">
      <Link to="/" className="back">← Back</Link>
      <h1>{lesson.title}</h1>
      <LessonCanvas lesson={lesson} time={player.time} compact={drawAlong} />
      {drawAlong && (
        <DrawPad viewBox={lesson.viewBox} size={canvasSize(lesson.viewBox, true)} />
      )}
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
    </main>
  )
}
