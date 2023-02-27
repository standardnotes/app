import { HttpResponse } from '@standardnotes/api'
import { AnyKeyParamsContent } from '@standardnotes/common'
import { RootKeyInterface } from '@standardnotes/models'

export type SessionManagerResponse = {
  response: HttpResponse
  rootKey?: RootKeyInterface
  keyParams?: AnyKeyParamsContent
}
