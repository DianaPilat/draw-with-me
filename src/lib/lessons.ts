import type { Lesson, LessonSummary } from './types'

const base = `${import.meta.env.BASE_URL}lessons/`

export const lessonAudioUrl = (file: string) => base + file

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(base + file)
  if (!res.ok) throw new Error(`Could not load ${file}`)
  return res.json() as Promise<T>
}

export const loadIndex = () => getJson<LessonSummary[]>('index.json')
export const loadLesson = (id: string) => getJson<Lesson>(`${id}.json`)
