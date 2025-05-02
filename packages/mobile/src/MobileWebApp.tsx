import React from 'react'
import { MobileWebAppContainer } from './MobileWebAppContainer'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export const MobileWebApp = () => {
  return (
    <SafeAreaProvider>
      <MobileWebAppContainer />
    </SafeAreaProvider>
  )
}
