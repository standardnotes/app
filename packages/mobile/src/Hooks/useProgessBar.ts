import { useCallback, useRef } from 'react'
import { Animated } from 'react-native'

export const useProgressBar = () => {
  const counterRef = useRef(new Animated.Value(0)).current

  const updateProgressBar = useCallback(
    (percentComplete: number) => {
      Animated.timing(counterRef, {
        toValue: percentComplete,
        duration: 500,
        useNativeDriver: false,
      }).start()
    },
    [counterRef],
  )

  const progressBarWidth = counterRef.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'identity',
  })

  return {
    updateProgressBar,
    progressBarWidth,
  }
}
