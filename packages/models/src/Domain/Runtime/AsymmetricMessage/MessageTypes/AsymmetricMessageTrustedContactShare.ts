import { TrustedContactContentSpecialized } from '../../../Syncable/TrustedContact/Content/TrustedContactContent'
import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageTrustedContactShare = {
  type: AsymmetricMessagePayloadType.ContactShare
  data: AsymmetricMessageDataCommon & { trustedContact: TrustedContactContentSpecialized }
}
