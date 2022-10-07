import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceCreationResponseBody } from './WorkspaceCreationResponseBody'

export interface WorkspaceCreationResponse extends HttpResponse {
  data: Either<WorkspaceCreationResponseBody, HttpErrorResponseBody>
}
