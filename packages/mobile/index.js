import { SNLog } from '@standardnotes/snjs'
import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import { enableScreens } from 'react-native-screens'
import 'react-native-url-polyfill/auto'
import { name as appName } from './app.json'
import { App } from './src/App'
import { enableAndroidFontFix } from './src/Style/android_text_fix'

enableScreens()
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

enableAndroidFontFix()

AppRegistry.registerComponent(appName, () => App)
