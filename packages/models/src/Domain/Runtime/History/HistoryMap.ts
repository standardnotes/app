import { Uuid } from '@standardnotes/common'
import { HistoryEntry } from './HistoryEntry'

export type HistoryMap = Record<Uuid, HistoryEntry[]>

export const historyMapFunctions = {
  getNewestRevision: (history: HistoryEntry[]): HistoryEntry | undefined => {
    return history[0]
  },
}
