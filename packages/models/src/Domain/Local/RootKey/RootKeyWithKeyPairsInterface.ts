import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { RootKeyInterface } from './RootKeyInterface'

export interface RootKeyWithKeyPairsInterface extends RootKeyInterface {
  get encryptionKeyPair(): PkcKeyPair
  get signingKeyPair(): PkcKeyPair
}
