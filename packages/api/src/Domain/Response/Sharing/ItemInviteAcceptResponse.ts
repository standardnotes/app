import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { ItemInviteAcceptResponseBody } from './ItemInviteAcceptResponseBody'

export interface ItemInviteAcceptResponse extends HttpResponse {
  data: Either<ItemInviteAcceptResponseBody, HttpErrorResponseBody>
}
