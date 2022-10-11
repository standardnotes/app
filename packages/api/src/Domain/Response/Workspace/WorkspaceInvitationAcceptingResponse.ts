import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { WorkspaceInvitationAcceptingResponseBody } from './WorkspaceInvitationAcceptingResponseBody'

export interface WorkspaceInvitationAcceptingResponse extends HttpResponse {
  data: Either<WorkspaceInvitationAcceptingResponseBody, HttpErrorResponseBody>
}
