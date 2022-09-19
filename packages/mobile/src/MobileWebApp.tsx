import { navigationRef } from '@Lib/NavigationService'
import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { MobileWebMainStackComponent } from './ModalStack'

const AppComponent: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <MobileWebMainStackComponent />
    </NavigationContainer>
  )
}

export const MobileWebApp = () => {
  return <AppComponent />
}
