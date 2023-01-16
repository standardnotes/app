import { Uuid } from '@standardnotes/domain-core'

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
  getRevision(
    itemUuid: Uuid,
    revisionUuid: Uuid,
  ): Promise<{
    uuid: string
    item_uuid: string
    content: string | null
    content_type: string
    items_key_id: string | null
    enc_item_key: string | null
    auth_hash: string | null
    created_at: string
    updated_at: string
  } | null>
}
