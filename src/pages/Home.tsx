import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from '../lib/lessons'
import { loadDone } from '../lib/progress'
import type { LessonSummary } from '../lib/types'

const CATEGORY_ICONS: Record<string, string> = {
  Characters: '🤖',
  Animals: '🐶',
  Things: '🏠',
  Nature: '🌳',
  Food: '🍎',
  Vehicles: '🚗',
}

const thumbUrl = (id: string) => `${import.meta.env.BASE_URL}lessons/thumbs/${id}.svg`

export default function Home() {
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [done] = useState(loadDone)

  useEffect(() => {
    loadIndex().then(setLessons, () => setLessons([]))
  }, [])

  // Categories in the order they first appear in index.json.
  const groups = useMemo(() => {
    const map = new Map<string, LessonSummary[]>()
    for (const l of lessons) map.set(l.category, [...(map.get(l.category) ?? []), l])
    return [...map]
  }, [lessons])

  const stars = lessons.filter((l) => done.has(l.id)).length

  return (
    <main className="page home">
      <h1>Draw with Me</h1>
      {lessons.length > 0 && (
        <p className="stars-total" aria-label={`${stars} of ${lessons.length} stars`}>
          ★ {stars} / {lessons.length}
        </p>
      )}
      {groups.map(([category, items]) => (
        <section key={category} className="category">
          <h2>
            {CATEGORY_ICONS[category] && (
              <span className="category-icon" aria-hidden="true">
                {CATEGORY_ICONS[category]}
              </span>
            )}
            {category}
          </h2>
          <div className="grid">
            {items.map((l) => (
              <Link key={l.id} to={`/lesson/${l.id}`} className="card" aria-label={l.title}>
                <img className="card-thumb" src={thumbUrl(l.id)} alt="" loading="lazy" />
                <span
                  className={done.has(l.id) ? 'star earned' : 'star'}
                  role="img"
                  aria-label={done.has(l.id) ? 'Star earned' : 'No star yet'}
                >
                  {done.has(l.id) ? '★' : '☆'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
