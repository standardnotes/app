import { log as utilsLog } from '@standardnotes/utils'

export enum LoggingDomain {
  Files,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.Files]: true,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
