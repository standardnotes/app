import { HttpResponse } from '@standardnotes/responses'
import { DeleteRevisionResponseBody } from '../../Response/Revision/DeleteRevisionResponseBody'
import { GetRevisionResponseBody } from '../../Response/Revision/GetRevisionResponseBody'
import { ListRevisionsResponseBody } from '../../Response/Revision/ListRevisionsResponseBody'

export interface RevisionApiServiceInterface {
  listRevisions(itemUuid: string): Promise<HttpResponse<ListRevisionsResponseBody>>
  getRevision(itemUuid: string, revisionUuid: string): Promise<HttpResponse<GetRevisionResponseBody>>
  deleteRevision(itemUuid: string, revisionUuid: string): Promise<HttpResponse<DeleteRevisionResponseBody>>
}
