import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageSenderKeypairChanged = {
  type: AsymmetricMessagePayloadType.SenderKeypairChanged
  data: AsymmetricMessageDataCommon & {
    newEncryptionPublicKey: string
    newSigningPublicKey: string
  }
}
