import { ErrorMessage } from '../../Error/ErrorMessage'
import { ApiCallError } from '../../Error/ApiCallError'

import { RevisionApiServiceInterface } from './RevisionApiServiceInterface'
import { RevisionApiOperations } from './RevisionApiOperations'
import { RevisionServerInterface } from '../../Server'
import { DeleteRevisionResponse } from '../../Response/Revision/DeleteRevisionResponse'
import { GetRevisionResponse } from '../../Response/Revision/GetRevisionResponse'
import { ListRevisionsResponse } from '../../Response/Revision/ListRevisionsResponse'

export class RevisionApiService implements RevisionApiServiceInterface {
  private operationsInProgress: Map<RevisionApiOperations, boolean>

  constructor(private revisionServer: RevisionServerInterface) {
    this.operationsInProgress = new Map()
  }

  async listRevisions(itemUuid: string): Promise<ListRevisionsResponse> {
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

  async getRevision(itemUuid: string, revisionUuid: string): Promise<GetRevisionResponse> {
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

  async deleteRevision(itemUuid: string, revisionUuid: string): Promise<DeleteRevisionResponse> {
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
