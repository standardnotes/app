import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type SuccessfullyChangedCredentialsEventData = {
  newKeyPair: PkcKeyPair
  newSigningKeyPair: PkcKeyPair
}
