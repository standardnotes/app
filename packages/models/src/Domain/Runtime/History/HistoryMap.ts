import { HistoryEntry } from './HistoryEntry'

export type HistoryMap = Record<string, HistoryEntry[]>

export const historyMapFunctions = {
  getNewestRevision: (history: HistoryEntry[]): HistoryEntry | undefined => {
    return history[0]
  },
}
