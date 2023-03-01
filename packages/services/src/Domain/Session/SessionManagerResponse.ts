import { HttpResponse, SignInResponse } from '@standardnotes/responses'
import { AnyKeyParamsContent } from '@standardnotes/common'
import { RootKeyInterface } from '@standardnotes/models'

export type SessionManagerResponse = {
  response: HttpResponse<SignInResponse>
  rootKey?: RootKeyInterface
  keyParams?: AnyKeyParamsContent
}
