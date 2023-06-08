import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { TrustedContactContent } from './TrustedContactContent'
import { TrustedContactPublicKeyInterface } from './TrustedContactPublicKeyInterface'

export type FindPublicKeyResult =
  | {
      publicKey: TrustedContactPublicKeyInterface
      current: boolean
    }
  | undefined

export interface TrustedContactInterface extends DecryptedItemInterface<TrustedContactContent> {
  name: string
  contactUuid: string
  publicKey: TrustedContactPublicKeyInterface

  findPublicKey(params: { targetEncryptionPublicKey: string; targetSigningPublicKey: string }): FindPublicKeyResult
}
