import { SNNote, SNTag, ItemCounts } from '@standardnotes/models'

export interface ItemCounterInterface {
  countNotesAndTags(items: Array<SNNote | SNTag>): ItemCounts
}
