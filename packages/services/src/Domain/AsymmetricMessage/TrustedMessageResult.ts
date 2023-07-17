import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'

export type TrustedMessageResult = {
  message: AsymmetricMessageServerHash
  payload: AsymmetricMessagePayload
}
