import { Uuid } from '@standardnotes/domain-core'
import { RevisionPayload } from './RevisionPayload'

export interface RevisionClientInterface {
  listRevisions(itemUuid: Uuid): Promise<
    Array<{
      uuid: string
      content_type: string
      created_at: string
      updated_at: string
      required_role: string
    }>
  >
  deleteRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<string>
  getRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<RevisionPayload | null>
}
