import { User } from '@standardnotes/responses'
import { AnyKeyParamsContent } from '@standardnotes/common'
import { RawSessionPayload } from './Sessions/Types'

export type ShareToken = RawSessionPayload & {
  masterKey: string
  keyParams: AnyKeyParamsContent
  user: User
  host: string
}
