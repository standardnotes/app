import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react'
import { SwipeGestureHandler } from './SwipeGestureHandler'

type SwipeGestureContextData = SwipeGestureHandler['addSwipeGestureListener']

const SwipeGestureContext = createContext<SwipeGestureContextData | null>(null)

export const useSwipeGesture = () => {
  const value = useContext(SwipeGestureContext)

  if (!value) {
    throw new Error('Component must be a child of <SwipeGestureProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

const MemoizedChildren = ({ children }: ChildrenProps) => <>{children}</>

export const SwipeGestureProvider = ({ children }: ChildrenProps) => {
  const swipeGestureHandler = useMemo(() => new SwipeGestureHandler(), [])

  useEffect(() => {
    return () => {
      swipeGestureHandler.deinit()
    }
  }, [swipeGestureHandler])

  const addSwipeGestureListener = useMemo(
    () => swipeGestureHandler.addSwipeGestureListener,
    [swipeGestureHandler.addSwipeGestureListener],
  )

  return (
    <SwipeGestureContext.Provider value={addSwipeGestureListener}>
      <MemoizedChildren children={children} />
    </SwipeGestureContext.Provider>
  )
}
