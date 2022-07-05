import { ContentType } from '@standardnotes/common'
import { LegacyAnonymousReference } from './LegacyAnonymousReference'

export interface LegacyTagToNoteReference extends LegacyAnonymousReference {
  content_type: ContentType.Note
}
