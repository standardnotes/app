import { RevisionApiServiceInterface } from '@standardnotes/api'
import { Uuid } from '@standardnotes/domain-core'
import { isErrorResponse } from '@standardnotes/responses'

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
    const result = await this.revisionApiService.listRevisions(itemUuid.value)

    if (isErrorResponse(result)) {
      throw new Error(result.data.error.message)
    }

    return result.data.revisions
  }

  async deleteRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<string> {
    const result = await this.revisionApiService.deleteRevision(itemUuid.value, revisionUuid.value)

    if (isErrorResponse(result)) {
      throw new Error(result.data.error.message)
    }

    return result.data.message
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
    const result = await this.revisionApiService.getRevision(itemUuid.value, revisionUuid.value)

    if (isErrorResponse(result)) {
      throw new Error(result.data.error.message)
    }

    return result.data.revision
  }
}
