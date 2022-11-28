import { Platform } from '@standardnotes/snjs'

export function isMacPlatform(platform: Platform) {
  return platform === Platform.MacDesktop || platform === Platform.MacWeb
}

export function isWindowsPlatform(platform: Platform) {
  return platform === Platform.WindowsDesktop || platform === Platform.WindowsWeb
}

export function isMobilePlatform(platform: Platform) {
  return platform === Platform.Ios || platform === Platform.Android
}
