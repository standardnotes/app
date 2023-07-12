import { LegacyAnonymousReference } from './LegacyAnonymousReference'

export interface LegacyTagToNoteReference extends LegacyAnonymousReference {
  content_type: string
}
