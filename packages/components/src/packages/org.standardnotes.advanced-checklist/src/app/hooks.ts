import React, { useEffect, useState } from 'react'
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
