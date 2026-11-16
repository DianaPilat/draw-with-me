import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDone, markDone } from './progress'

const KEY = 'draw-with-me:done'

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  }
}

describe('progress', () => {
  let storage: ReturnType<typeof fakeStorage>

  beforeEach(() => {
    storage = fakeStorage()
    vi.stubGlobal('localStorage', storage)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('starts empty', () => {
    expect(loadDone().size).toBe(0)
  })

  it('remembers finished lessons', () => {
    markDone('01')
    markDone('02')
    expect([...loadDone()].sort()).toEqual(['01', '02'])
  })

  it('does not duplicate a lesson finished twice', () => {
    markDone('01')
    markDone('01')
    expect(JSON.parse(storage.data.get(KEY)!)).toEqual(['01'])
  })

  it('ignores corrupt stored data', () => {
    storage.data.set(KEY, '{not json')
    expect(loadDone().size).toBe(0)
  })

  it('ignores stored data of the wrong shape', () => {
    storage.data.set(KEY, JSON.stringify({ a: 1 }))
    expect(loadDone().size).toBe(0)
  })

  it('keeps only string ids', () => {
    storage.data.set(KEY, JSON.stringify(['01', 2, null, '03']))
    expect([...loadDone()]).toEqual(['01', '03'])
  })

  it('fails soft when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
    expect(loadDone().size).toBe(0)
    expect(() => markDone('01')).not.toThrow()
  })
})
