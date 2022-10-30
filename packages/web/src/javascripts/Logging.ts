import { log as utilsLog } from '@standardnotes/utils'
import { isDev } from './Utils'

export enum LoggingDomain {
  DailyNotes,
  NoteView,
  ItemsList,
  NavigationList,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.DailyNotes]: false,
  [LoggingDomain.NoteView]: false,
  [LoggingDomain.ItemsList]: false,
  [LoggingDomain.NavigationList]: false,
}

export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDev || !LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
