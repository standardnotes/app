import { RevisionApiServiceInterface } from '@standardnotes/api'
import { Uuid } from '@standardnotes/domain-core'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { RevisionClientInterface } from './RevisionClientInterface'

export class RevisionManager extends AbstractService implements RevisionClientInterface {
  constructor(
    private revisionApiService: RevisionApiServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async listRevisions(
    itemUuid: Uuid,
  ): Promise<{ uuid: string; content_type: string; created_at: string; updated_at: string; required_role: string }[]> {
    try {
      const result = await this.revisionApiService.listRevisions(itemUuid.value)

      if (result.data.error) {
        return []
      }

      return result.data.revisions
    } catch (error) {
      return []
    }
  }

  async deleteRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<string> {
    try {
      const result = await this.revisionApiService.deleteRevision(itemUuid.value, revisionUuid.value)

      if (result.data.error) {
        return result.data.error.message
      }

      return result.data.message
    } catch (error) {
      return 'An error occurred while deleting the revision.'
    }
  }

  async getRevision(
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
  } | null> {
    try {
      const result = await this.revisionApiService.getRevision(itemUuid.value, revisionUuid.value)

      if (result.data.error) {
        return null
      }

      return result.data.revision
    } catch (error) {
      return null
    }
  }
}
