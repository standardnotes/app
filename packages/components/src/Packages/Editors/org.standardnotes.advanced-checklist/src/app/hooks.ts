import useResizeObserver from '@react-hook/resize-observer'
import React, { useEffect, useRef, useState } from 'react'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useDidMount = (effect: React.EffectCallback, deps?: React.DependencyList) => {
  const [didMount, setDidMount] = useState(false)

  useEffect(() => {
    if (didMount) {
      effect()
    } else {
      setDidMount(true)
    }
  }, [deps, didMount, effect])
}

export const useResize = (ref: React.RefObject<HTMLElement>, effect: (target: HTMLElement) => void) => {
  const [size, setSize] = useState<DOMRect>()

  function isDeepEqual(prevSize?: DOMRect, nextSize?: DOMRect) {
    return JSON.stringify(prevSize) === JSON.stringify(nextSize)
  }

  useResizeObserver(ref, ({ contentRect, target }) => {
    if (!isDeepEqual(size, contentRect)) {
      setSize(contentRect)
      effect(target as HTMLElement)
    }
  })
}

export const useDebouncedCallback = (callback: () => void, waitMs: number = 500) => {
  const timeout = useRef<any>()

  clearTimeout(timeout.current)

  timeout.current = setTimeout(() => {
    callback()
  }, waitMs)
}

export const usePrevious = (value: any) => {
  const ref = useRef<typeof value>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
