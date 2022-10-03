import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { ItemInviteCancelResponseBody } from './ItemInviteCancelResponseBody'

export interface ItemInviteCancelResponse extends HttpResponse {
  data: Either<ItemInviteCancelResponseBody, HttpErrorResponseBody>
}
