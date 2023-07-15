import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageSenderKeysetRevoked = {
  type: AsymmetricMessagePayloadType.SenderKeysetRevoked
  data: AsymmetricMessageDataCommon & {
    revokedPublicKey: string
    revokedSigningPublicKey: string
  }
}
