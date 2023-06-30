import { TrustedContactContentSpecialized } from '../../../Syncable/TrustedContact/TrustedContactContent'
import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageTrustedContactShare = {
  type: AsymmetricMessagePayloadType.ContactShare
  data: AsymmetricMessageDataCommon & { trustedContact: TrustedContactContentSpecialized }
}
