import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { ItemInviteListResponseBody } from './ItemInviteListResponseBody'

export interface ItemInviteListResponse extends HttpResponse {
  data: Either<ItemInviteListResponseBody, HttpErrorResponseBody>
}
