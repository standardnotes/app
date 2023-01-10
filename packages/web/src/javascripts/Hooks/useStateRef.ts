import { useRef, useLayoutEffect, MutableRefObject } from 'react'

export function useStateRef<State>(state: State): MutableRefObject<State> {
  const ref = useRef<State>(state)

  useLayoutEffect(() => {
    ref.current = state
  }, [state])

  return ref
}
