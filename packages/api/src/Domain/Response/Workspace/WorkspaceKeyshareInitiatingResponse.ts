import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceKeyshareInitiatingResponseBody } from './WorkspaceKeyshareInitiatingResponseBody'

export interface WorkspaceKeyshareInitiatingResponse extends HttpResponse {
  data: Either<WorkspaceKeyshareInitiatingResponseBody, HttpErrorResponseBody>
}
