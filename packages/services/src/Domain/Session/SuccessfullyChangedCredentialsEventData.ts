import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type SuccessfullyChangedCredentialsEventData = {
  oldKeyPair: PkcKeyPair
  oldSigningKeyPair: PkcKeyPair

  newKeyPair: PkcKeyPair
  newSigningKeyPair: PkcKeyPair
}
