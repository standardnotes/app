import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { TrustedContactContent } from './Content/TrustedContactContent'
import { ContactPublicKeySetInterface } from './PublicKeySet/ContactPublicKeySetInterface'
import { PublicKeyTrustStatus } from './Types/PublicKeyTrustStatus'

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  name: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetInterface
  isMe: boolean

  getTrustStatusForPublicKey(encryptionPublicKey: string): PublicKeyTrustStatus
  getTrustStatusForSigningPublicKey(signingPublicKey: string): PublicKeyTrustStatus
  hasCurrentOrPreviousSigningPublicKey(signingPublicKey: string): boolean
}
