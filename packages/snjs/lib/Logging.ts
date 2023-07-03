import { log as utilsLog } from '@standardnotes/utils'

export const isDev = true

export enum LoggingDomain {
  DatabaseLoad,
  Sync,
  AccountMigration,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.DatabaseLoad]: false,
  [LoggingDomain.Sync]: false,
  [LoggingDomain.AccountMigration]: true,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDev || !LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
