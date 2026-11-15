import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Controls from '../components/Controls'
import LessonCanvas from '../components/LessonCanvas'
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
  const step = lesson.steps[player.stepIndex]

  useEffect(() => {
    if (player.finished) markDone(lesson.id)
  }, [player.finished, lesson.id])

  return (
    <main className="page lesson">
      <Link to="/" className="back">← Back</Link>
      <h1>{lesson.title}</h1>
      <LessonCanvas lesson={lesson} time={player.time} />
      <p className="caption" aria-live="polite">{step?.narration}</p>
      <Controls
        playing={player.playing}
        finished={player.finished}
        stepMode={player.stepMode}
        onPlay={player.play}
        onPause={player.pause}
        onReplay={player.replay}
        onNext={player.next}
        onStepMode={player.setStepMode}
      />
    </main>
  )
}
