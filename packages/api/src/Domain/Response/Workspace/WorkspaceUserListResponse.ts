import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceUserListResponseBody } from './WorkspaceUserListResponseBody'

export interface WorkspaceUserListResponse extends HttpResponse {
  data: Either<WorkspaceUserListResponseBody, HttpErrorResponseBody>
}
