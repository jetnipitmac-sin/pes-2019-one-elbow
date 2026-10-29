// Tiny external stores so that a value changing on scroll (current chapter,
// whether WebGL should run) re-renders only the component that shows it,
// not the whole page.
import { useSyncExternalStore } from 'react'

export function createStore(value) {
  const subs = new Set()
  return {
    get: () => value,
    set: (v) => {
      if (v === value) return
      value = v
      subs.forEach((f) => f())
    },
    subscribe: (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
  }
}

export const useStore = (s) => useSyncExternalStore(s.subscribe, s.get)

export const chapterStore = createStore('hero')
export const glStore = createStore(true)
