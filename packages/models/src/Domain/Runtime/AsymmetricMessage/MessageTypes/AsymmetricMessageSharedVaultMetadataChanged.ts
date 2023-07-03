import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageSharedVaultMetadataChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged
  data: AsymmetricMessageDataCommon & {
    sharedVaultUuid: string
    name: string
    description?: string
  }
}
