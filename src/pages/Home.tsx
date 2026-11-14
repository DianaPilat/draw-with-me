import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from '../lib/lessons'
import type { LessonSummary } from '../lib/types'

export default function Home() {
  const [lessons, setLessons] = useState<LessonSummary[]>([])

  useEffect(() => {
    loadIndex().then(setLessons, () => setLessons([]))
  }, [])

  return (
    <main className="page home">
      <h1>Draw with Me</h1>
      <div className="grid">
        {lessons.map((l) => (
          <Link key={l.id} to={`/lesson/${l.id}`} className="card">
            <span className="card-title">{l.title}</span>
            <span className="card-cat">{l.category}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
