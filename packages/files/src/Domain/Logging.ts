import { logWithColor } from '@standardnotes/utils'

declare const process: {
  env: {
    NODE_ENV: string | null | undefined
  }
}

export const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

export enum LoggingDomain {
  FilesPackage,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.FilesPackage]: false,
}

const DomainColor: Record<LoggingDomain, string> = {
  [LoggingDomain.FilesPackage]: 'green',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDev || !LoggingStatus[domain]) {
    return
  }

  logWithColor(LoggingDomain[domain], DomainColor[domain], ...args)
}
