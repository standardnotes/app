import { log as utilsLog } from '@standardnotes/utils'
import { isDev } from './Utils'

export enum LoggingDomain {
  DailyNotes,
  NoteView,
  ItemsList,
  NavigationList,
  Viewport,
  Selection,
  BlockEditor,
}

const LoggingStatus: Record<LoggingDomain, boolean> = {
  [LoggingDomain.DailyNotes]: false,
  [LoggingDomain.NoteView]: false,
  [LoggingDomain.ItemsList]: false,
  [LoggingDomain.NavigationList]: false,
  [LoggingDomain.Viewport]: false,
  [LoggingDomain.Selection]: false,
  [LoggingDomain.BlockEditor]: true,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(domain: LoggingDomain, ...args: any[]): void {
  if (!isDev || !LoggingStatus[domain]) {
    return
  }

  utilsLog(LoggingDomain[domain], ...args)
}
