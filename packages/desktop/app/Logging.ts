import { isDev } from './javascripts/Main/Utils/Utils'
import { log as utilsLog } from '@standardnotes/utils'

export const isDevMode = isDev()

export enum LoggingDomain {
  Backups,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.Backups]: true,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDevMode || !LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
