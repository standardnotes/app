import { DeleteRevisionResponse } from '../../Response/Revision/DeleteRevisionResponse'
import { GetRevisionResponse } from '../../Response/Revision/GetRevisionResponse'
import { ListRevisionsResponse } from '../../Response/Revision/ListRevisionsResponse'

export interface RevisionApiServiceInterface {
  listRevisions(itemUuid: string): Promise<ListRevisionsResponse>
  getRevision(itemUuid: string, revisionUuid: string): Promise<GetRevisionResponse>
  deleteRevision(itemUuid: string, revisionUuid: string): Promise<DeleteRevisionResponse>
}
