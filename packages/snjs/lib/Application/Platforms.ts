import { Environment, Platform } from '@standardnotes/models'

export function platformFromString(string: string) {
  const map: Record<string, Platform> = {
    'mac-web': Platform.MacWeb,
    'mac-desktop': Platform.MacDesktop,
    'linux-web': Platform.LinuxWeb,
    'linux-desktop': Platform.LinuxDesktop,
    'windows-web': Platform.WindowsWeb,
    'windows-desktop': Platform.WindowsDesktop,
    'ios-web': Platform.Ios,
    'android-web': Platform.Android,
  }
  return map[string]
}

export function platformToString(platform: Platform) {
  const map = {
    [Platform.MacWeb]: 'mac-web',
    [Platform.MacDesktop]: 'mac-desktop',
    [Platform.LinuxWeb]: 'linux-web',
    [Platform.LinuxDesktop]: 'linux-desktop',
    [Platform.WindowsWeb]: 'windows-web',
    [Platform.WindowsDesktop]: 'windows-desktop',
    [Platform.Ios]: 'ios',
    [Platform.Android]: 'android',
  }
  return map[platform]
}

export function environmentToString(environment: Environment) {
  const map = {
    [Environment.Web]: 'web',
    [Environment.Desktop]: 'desktop',
    [Environment.Mobile]: 'native-mobile-web',
    [Environment.Clipper]: 'clipper',
  }
  return map[environment]
}

export function isEnvironmentWebOrDesktop(environment: Environment) {
  return environment === Environment.Web || environment === Environment.Desktop
}

export function isEnvironmentMobile(environment: Environment) {
  return environment === Environment.Mobile
}
