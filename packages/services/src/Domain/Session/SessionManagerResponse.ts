import { AnyKeyParamsContent } from '@standardnotes/common'
import { RootKeyInterface } from '@standardnotes/models'
import { HttpResponse } from '@standardnotes/responses'

export type SessionManagerResponse = {
  response: HttpResponse
  rootKey?: RootKeyInterface
  keyParams?: AnyKeyParamsContent
}
