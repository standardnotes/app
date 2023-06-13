import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { FindPublicKeySetResult } from './PublicKeySet/FindPublicKeySetResult'
import { TrustedContactContent } from './TrustedContactContent'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetInterface

  findKeySet(params: { targetEncryptionPublicKey: string; targetSigningPublicKey: string }): FindPublicKeySetResult

  isPublicKeyTrusted(encryptionPublicKey: string): boolean
  isSigningKeyTrusted(signingKey: string): boolean
}
