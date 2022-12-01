import { logWithColor } from '@standardnotes/utils'

declare const process: {
  env: {
    NODE_ENV: string | null | undefined
  }
}

export const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

export enum LoggingDomain {
  FilesService,
  FilesBackups,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.FilesService]: false,
  [LoggingDomain.FilesBackups]: false,
}

const LoggingColor: Record<LoggingDomain, string> = {
  [LoggingDomain.FilesService]: 'blue',
  [LoggingDomain.FilesBackups]: 'yellow',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDev || !LoggingStatus[domain]) {
    return
  }

  logWithColor(LoggingDomain[domain], LoggingColor[domain], ...args)
}
