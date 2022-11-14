import { log as utilsLog } from '@standardnotes/snjs'

export enum LoggingDomain {
  AppleIAP,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.AppleIAP]: false,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
