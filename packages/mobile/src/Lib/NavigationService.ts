import { NavigationContainerRef, StackActions } from '@react-navigation/native'
import { AppStackNavigatorParamList } from '@Root/AppStack'
import { ModalStackNavigatorParamList } from '@Root/ModalStack'
import * as React from 'react'

export const navigationRef =
  React.createRef<NavigationContainerRef<AppStackNavigatorParamList & ModalStackNavigatorParamList>>()

export function navigate(name: keyof AppStackNavigatorParamList | keyof ModalStackNavigatorParamList, params?: any) {
  navigationRef.current?.navigate(name, params)
}

export function push(name: string, params?: any) {
  const pushAction = StackActions.push(name, params)

  navigationRef.current?.dispatch(pushAction)
}

export function goBack() {
  navigationRef.current?.goBack()
}
