import { CommandLineArgs } from '../../Shared/CommandLineArgs'
import { isWindows } from '../Types/Platforms'

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isTesting(): boolean {
  return isDev() && process.argv.includes(CommandLineArgs.Testing)
}

export function isBoolean(arg: unknown): arg is boolean {
  return typeof arg === 'boolean'
}

export function ensureIsBoolean(arg: unknown, fallbackValue: boolean): boolean {
  if (isBoolean(arg)) {
    return arg
  }
  return fallbackValue
}

export function stringOrNull(arg: unknown): string | null {
  if (typeof arg === 'string') {
    return arg
  }
  return null
}

/** Ensures a path's drive letter is lowercase. */
export function lowercaseDriveLetter(filePath: string): string {
  return filePath.replace(/^\/[A-Z]:\//, (letter) => letter.toLowerCase())
}

function decodePathnameSafely(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

/**
 * Determines whether `candidateUrl` points at the same local file as `appUrl`.
 *
 * `file:` URLs have an opaque origin, so we compare scheme, host and normalized
 * path explicitly. The scheme and host must match: comparing paths alone would let
 * a remote page (e.g. `https://attacker.example/<same path>`) be treated as the app.
 *
 * Query strings and hashes are ignored on purpose, since the app reads deep-link
 * parameters from them and production URLs can carry "#!/" suffixes.
 *
 * Fails closed: any malformed input returns `false`.
 */
export function fileUrlsAreEqual(
  candidateUrl: string,
  appUrl: string,
  options: { isWindows: boolean } = { isWindows: isWindows() },
): boolean {
  try {
    const candidate = new URL(candidateUrl)
    const app = new URL(appUrl)

    if (candidate.protocol !== 'file:' || app.protocol !== 'file:') {
      return false
    }

    /** `file://localhost/...` is normalized to an empty host by the URL parser. */
    if (candidate.host !== app.host) {
      return false
    }

    /**
     * In the packaged app, spaces in navigation event URLs can be encoded as %20
     * while the app URL contains them raw, so compare decoded paths.
     */
    let candidatePath = decodePathnameSafely(candidate.pathname)
    let appPath = decodePathnameSafely(app.pathname)

    if (options.isWindows) {
      /** On Windows, drive letter casing is inconsistent */
      candidatePath = lowercaseDriveLetter(candidatePath)
      appPath = lowercaseDriveLetter(appPath)
    }

    return candidatePath === appPath
  } catch {
    return false
  }
}

export function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function removeFromArray<T>(array: T[], toRemove: T): void {
  array.splice(array.indexOf(toRemove), 1)
}

export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1]
}
