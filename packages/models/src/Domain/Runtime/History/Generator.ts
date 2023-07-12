import { ContentType } from '@standardnotes/domain-core'

import { DecryptedPayloadInterface } from './../../Abstract/Payload/Interfaces/DecryptedPayload'
import { NoteContent } from '../../Syncable/Note'
import { HistoryEntry } from './HistoryEntry'
import { NoteHistoryEntry } from './NoteHistoryEntry'

export function CreateHistoryEntryForPayload(
  payload: DecryptedPayloadInterface<NoteContent>,
  previousEntry?: HistoryEntry,
): HistoryEntry {
  const type = payload.content_type
  const historyItemClass = historyClassForContentType(type)
  const entry = new historyItemClass(payload, previousEntry)
  return entry
}

function historyClassForContentType(contentType: string) {
  switch (contentType) {
    case ContentType.TYPES.Note:
      return NoteHistoryEntry
    default:
      return HistoryEntry
  }
}
