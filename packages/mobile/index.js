import { SNLog } from '@standardnotes/snjs'
import { AppRegistry } from 'react-native'
import { name as appName } from './app.json'
import { MobileWebApp } from './src/MobileWebApp'

/* eslint-disable no-console, @typescript-eslint/no-empty-function */
if (__DEV__ === false) {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
  SNLog.onError = console.error
  SNLog.onLog = console.log
} else {
  SNLog.onError = console.error
  SNLog.onLog = console.log
}
/* eslint-enable no-console */

const originalWarn = console.warn

console.warn = function filterWarnings(msg) {
  const supressedWarnings = [
    "[react-native-gesture-handler] Seems like you're using an old API with gesture components",
  ]

  if (!supressedWarnings.some((entry) => msg.includes(entry))) {
    originalWarn.apply(console, arguments)
  }
}

AppRegistry.registerComponent(appName, () => MobileWebApp)
