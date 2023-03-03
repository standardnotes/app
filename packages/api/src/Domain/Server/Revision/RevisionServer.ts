import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { DeleteRevisionRequestParams, GetRevisionRequestParams, ListRevisionsRequestParams } from '../../Request'
import { HttpResponse } from '@standardnotes/responses'
import { DeleteRevisionResponseBody } from '../../Response/Revision/DeleteRevisionResponseBody'
import { GetRevisionResponseBody } from '../../Response/Revision/GetRevisionResponseBody'
import { ListRevisionsResponseBody } from '../../Response/Revision/ListRevisionsResponseBody'

import { Paths } from './Paths'
import { RevisionServerInterface } from './RevisionServerInterface'

export class RevisionServer implements RevisionServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async listRevisions(params: ListRevisionsRequestParams): Promise<HttpResponse<ListRevisionsResponseBody>> {
    return this.httpService.get(Paths.v2.listRevisions(params.itemUuid))
  }

  async getRevision(params: GetRevisionRequestParams): Promise<HttpResponse<GetRevisionResponseBody>> {
    return this.httpService.get(Paths.v2.getRevision(params.itemUuid, params.revisionUuid))
  }

  async deleteRevision(params: DeleteRevisionRequestParams): Promise<HttpResponse<DeleteRevisionResponseBody>> {
    return this.httpService.delete(Paths.v2.deleteRevision(params.itemUuid, params.revisionUuid))
  }
}
