import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type SuccessfullyChangedCredentialsEventData = {
  oldKeyPair: PkcKeyPair | undefined
  oldSigningKeyPair: PkcKeyPair | undefined

  newKeyPair: PkcKeyPair
  newSigningKeyPair: PkcKeyPair
}
