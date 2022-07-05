import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { NoteContent } from '../../Syncable/Note/NoteContent'

export interface HistoryEntryInterface {
  readonly payload: DecryptedPayloadInterface<NoteContent>
  readonly previousEntry?: HistoryEntryInterface
  itemFromPayload(): DecryptedItemInterface
  isSameAsEntry(entry: HistoryEntryInterface): boolean
  isDiscardable(): boolean
  operationVector(): number
  deltaSize(): number
}
