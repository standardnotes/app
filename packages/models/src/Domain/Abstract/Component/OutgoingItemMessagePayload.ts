import { ItemContent } from './../Content/ItemContent'
import { ContentType } from '@standardnotes/common'

export type OutgoingItemMessagePayload<C extends ItemContent = ItemContent> = {
  uuid: string
  content_type: ContentType
  created_at: Date
  updated_at: Date
  deleted?: boolean
  content?: C
  clientData?: Record<string, unknown>

  /**
   * isMetadataUpdate implies that the extension should make reference of updated
   * metadata, but not update content values as they may be stale relative to what the
   * extension currently has.
   */
  isMetadataUpdate: boolean
}
