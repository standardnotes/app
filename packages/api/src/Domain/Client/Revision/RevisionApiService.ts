import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'
import { HttpResponse } from '@standardnotes/responses'

import { RevisionApiServiceInterface } from './RevisionApiServiceInterface'
import { RevisionApiOperations } from './RevisionApiOperations'
import { RevisionServerInterface } from '../../Server'
import { DeleteRevisionResponseBody } from '../../Response/Revision/DeleteRevisionResponseBody'
import { GetRevisionResponseBody } from '../../Response/Revision/GetRevisionResponseBody'
import { ListRevisionsResponseBody } from '../../Response/Revision/ListRevisionsResponseBody'

export class RevisionApiService implements RevisionApiServiceInterface {
  private operationsInProgress: Map<RevisionApiOperations, boolean>

  constructor(private revisionServer: RevisionServerInterface) {
    this.operationsInProgress = new Map()
  }

  async listRevisions(itemUuid: string): Promise<HttpResponse<ListRevisionsResponseBody>> {
    if (this.operationsInProgress.get(RevisionApiOperations.List)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(RevisionApiOperations.List, true)

    try {
      const response = await this.revisionServer.listRevisions({
        itemUuid,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(RevisionApiOperations.List, false)
    }
  }

  async getRevision(itemUuid: string, revisionUuid: string): Promise<HttpResponse<GetRevisionResponseBody>> {
    if (this.operationsInProgress.get(RevisionApiOperations.Get)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(RevisionApiOperations.Get, true)

    try {
      const response = await this.revisionServer.getRevision({
        itemUuid,
        revisionUuid,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(RevisionApiOperations.Get, false)
    }
  }

  async deleteRevision(itemUuid: string, revisionUuid: string): Promise<HttpResponse<DeleteRevisionResponseBody>> {
    if (this.operationsInProgress.get(RevisionApiOperations.Delete)) {
      throw new ApiCallError(ErrorMessage.GenericInProgress)
    }

    this.operationsInProgress.set(RevisionApiOperations.Delete, true)

    try {
      const response = await this.revisionServer.deleteRevision({
        itemUuid,
        revisionUuid,
      })

      return response
    } catch (error) {
      throw new ApiCallError(ErrorMessage.GenericFail)
    } finally {
      this.operationsInProgress.set(RevisionApiOperations.Delete, false)
    }
  }
}
