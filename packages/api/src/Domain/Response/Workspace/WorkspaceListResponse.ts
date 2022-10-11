import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceListResponseBody } from './WorkspaceListResponseBody'

export interface WorkspaceListResponse extends HttpResponse {
  data: Either<WorkspaceListResponseBody, HttpErrorResponseBody>
}
