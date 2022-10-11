import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceInvitationResponseBody } from './WorkspaceInvitationResponseBody'

export interface WorkspaceInvitationResponse extends HttpResponse {
  data: Either<WorkspaceInvitationResponseBody, HttpErrorResponseBody>
}
