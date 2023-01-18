import { DeleteRevisionRequestParams } from '../../Request/Revision/DeleteRevisionRequestParams'
import { GetRevisionRequestParams } from '../../Request/Revision/GetRevisionRequestParams'
import { ListRevisionsRequestParams } from '../../Request/Revision/ListRevisionsRequestParams'
import { DeleteRevisionResponse } from '../../Response/Revision/DeleteRevisionResponse'
import { GetRevisionResponse } from '../../Response/Revision/GetRevisionResponse'
import { ListRevisionsResponse } from '../../Response/Revision/ListRevisionsResponse'

export interface RevisionServerInterface {
  listRevisions(params: ListRevisionsRequestParams): Promise<ListRevisionsResponse>
  getRevision(params: GetRevisionRequestParams): Promise<GetRevisionResponse>
  deleteRevision(params: DeleteRevisionRequestParams): Promise<DeleteRevisionResponse>
}
