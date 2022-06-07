import { CommandLineArgs } from '../../Shared/CommandLineArgs'

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

export function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function removeFromArray<T>(array: T[], toRemove: T): void {
  array.splice(array.indexOf(toRemove), 1)
}

export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1]
}
