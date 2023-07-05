import { RevisionApiServiceInterface } from '@standardnotes/api'
import { Uuid } from '@standardnotes/domain-core'
import { getErrorFromErrorResponse, isErrorResponse } from '@standardnotes/responses'

import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { RevisionClientInterface } from './RevisionClientInterface'
import { RevisionPayload } from './RevisionPayload'

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
      throw new Error(getErrorFromErrorResponse(result).message)
    }

    return result.data.revisions
  }

  async deleteRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<string> {
    const result = await this.revisionApiService.deleteRevision(itemUuid.value, revisionUuid.value)

    if (isErrorResponse(result)) {
      throw new Error(getErrorFromErrorResponse(result).message)
    }

    return result.data.message
  }

  async getRevision(itemUuid: Uuid, revisionUuid: Uuid): Promise<RevisionPayload | null> {
    const result = await this.revisionApiService.getRevision(itemUuid.value, revisionUuid.value)

    if (isErrorResponse(result)) {
      throw new Error(getErrorFromErrorResponse(result).message)
    }

    return result.data.revision
  }
}
