// moment.js
import moment from 'moment'
import { NativeModules, Platform } from 'react-native'

// moment.js
const locale =
  Platform.OS === 'android'
    ? NativeModules.I18nManager.localeIdentifier
    : NativeModules.SettingsManager.settings.AppleLocale
moment.locale(locale)

export default moment
