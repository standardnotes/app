import { KeyParamsData, SessionBody } from '@standardnotes/responses'

export type UserRegistrationResponseBody = {
  session: SessionBody
  key_params: KeyParamsData
  user: {
    uuid: string
    email: string
  }
}
