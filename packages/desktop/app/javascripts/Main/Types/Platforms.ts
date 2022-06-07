/**
 * TODO(baptiste): precompute these booleans at compile-time
 * (requires one webpack build per platform)
 */

export function isWindows(): boolean {
  return process.platform === 'win32'
}
export function isMac(): boolean {
  return process.platform === 'darwin'
}
export function isLinux(): boolean {
  return process.platform === 'linux'
}

export type InstallerKey = 'mac' | 'windows' | 'appimage_64' | 'appimage_32'
export function getInstallerKey(): InstallerKey {
  if (isWindows()) {
    return 'windows'
  } else if (isMac()) {
    return 'mac'
  } else if (isLinux()) {
    if (process.arch === 'x32') {
      return 'appimage_32'
    } else {
      return 'appimage_64'
    }
  } else {
    throw new Error(`Unknown platform: ${process.platform}`)
  }
}
