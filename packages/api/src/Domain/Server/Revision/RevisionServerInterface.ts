import { HttpResponse } from '@standardnotes/responses'
import { DeleteRevisionRequestParams } from '../../Request/Revision/DeleteRevisionRequestParams'
import { GetRevisionRequestParams } from '../../Request/Revision/GetRevisionRequestParams'
import { ListRevisionsRequestParams } from '../../Request/Revision/ListRevisionsRequestParams'
import { DeleteRevisionResponseBody } from '../../Response/Revision/DeleteRevisionResponseBody'
import { GetRevisionResponseBody } from '../../Response/Revision/GetRevisionResponseBody'
import { ListRevisionsResponseBody } from '../../Response/Revision/ListRevisionsResponseBody'

export interface RevisionServerInterface {
  listRevisions(params: ListRevisionsRequestParams): Promise<HttpResponse<ListRevisionsResponseBody>>
  getRevision(params: GetRevisionRequestParams): Promise<HttpResponse<GetRevisionResponseBody>>
  deleteRevision(params: DeleteRevisionRequestParams): Promise<HttpResponse<DeleteRevisionResponseBody>>
}
