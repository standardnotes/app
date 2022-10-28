import { log as utilsLog } from '@standardnotes/utils'

export enum LoggingDomain {
  DailyNotes,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.DailyNotes]: false,
}

export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
