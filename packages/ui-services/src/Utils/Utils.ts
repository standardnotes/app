import { Platform } from '@standardnotes/models'

declare global {
  interface Document {
    documentMode?: string
  }

  interface Window {
    MSStream?: unknown
    platform?: Platform
  }
}

// https://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
export const isIOS = () =>
  (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document && navigator.maxTouchPoints > 1) ||
  window.platform === Platform.Ios

export const isAndroid = () => navigator.userAgent.toLowerCase().includes('android')
