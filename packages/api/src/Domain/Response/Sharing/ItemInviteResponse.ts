import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { ItemInviteResponseBody } from './ItemInviteResponseBody'

export interface ItemInviteResponse extends HttpResponse {
  data: Either<ItemInviteResponseBody, HttpErrorResponseBody>
}
