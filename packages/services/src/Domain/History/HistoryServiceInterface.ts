import { HistoryEntry, HistoryMap, SNNote } from '@standardnotes/models'

export interface HistoryServiceInterface {
  getHistoryMapCopy(): HistoryMap
  sessionHistoryForItem(item: SNNote): HistoryEntry[]
}
