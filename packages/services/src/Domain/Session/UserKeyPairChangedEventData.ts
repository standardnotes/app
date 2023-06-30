import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export type UserKeyPairChangedEventData = {
  oldKeyPair: PkcKeyPair | undefined
  oldSigningKeyPair: PkcKeyPair | undefined

  newKeyPair: PkcKeyPair
  newSigningKeyPair: PkcKeyPair
}
