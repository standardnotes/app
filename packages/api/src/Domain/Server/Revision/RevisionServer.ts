import { HttpServiceInterface } from '../../Http/HttpServiceInterface'
import { DeleteRevisionRequestParams, GetRevisionRequestParams, ListRevisionsRequestParams } from '../../Request'
import { DeleteRevisionResponse } from '../../Response/Revision/DeleteRevisionResponse'
import { GetRevisionResponse } from '../../Response/Revision/GetRevisionResponse'
import { ListRevisionsResponse } from '../../Response/Revision/ListRevisionsResponse'

import { Paths } from './Paths'
import { RevisionServerInterface } from './RevisionServerInterface'

export class RevisionServer implements RevisionServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async listRevisions(params: ListRevisionsRequestParams): Promise<ListRevisionsResponse> {
    const response = await this.httpService.get(Paths.v2.listRevisions(params.itemUuid))

    return response as ListRevisionsResponse
  }

  async getRevision(params: GetRevisionRequestParams): Promise<GetRevisionResponse> {
    const response = await this.httpService.post(Paths.v2.getRevision(params.itemUuid, params.revisionUuid))

    return response as GetRevisionResponse
  }

  async deleteRevision(params: DeleteRevisionRequestParams): Promise<DeleteRevisionResponse> {
    const response = await this.httpService.delete(Paths.v2.deleteRevision(params.itemUuid, params.revisionUuid))

    return response as DeleteRevisionResponse
  }
}
