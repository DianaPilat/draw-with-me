const KEY = 'draw-with-me:done'

/** Ids of lessons the child has watched to the end. Storage can be blocked, so fail soft. */
export function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    const ids: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(ids) ? ids.filter((i) => typeof i === 'string') : [])
  } catch {
    return new Set()
  }
}

export function markDone(id: string) {
  try {
    const done = loadDone()
    if (done.has(id)) return
    done.add(id)
    localStorage.setItem(KEY, JSON.stringify([...done]))
  } catch {
    // Progress is a nicety; ignore storage errors.
  }
}
