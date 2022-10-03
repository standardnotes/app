import { Either } from '@standardnotes/common'

import { HttpErrorResponseBody } from '../../Http/HttpErrorResponseBody'
import { HttpResponse } from '../../Http/HttpResponse'
import { ItemInviteDeclineResponseBody } from './ItemInviteDeclineResponseBody'

export interface ItemInviteDeclineResponse extends HttpResponse {
  data: Either<ItemInviteDeclineResponseBody, HttpErrorResponseBody>
}
