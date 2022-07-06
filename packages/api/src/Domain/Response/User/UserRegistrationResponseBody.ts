import { Uuid } from '@standardnotes/common'
import { KeyParamsData, SessionBody } from '@standardnotes/responses'

export type UserRegistrationResponseBody = {
  session: SessionBody
  key_params: KeyParamsData
  user: {
    uuid: Uuid
    email: string
  }
}
