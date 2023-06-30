import { KeySystemRootKeyContentSpecialized } from '../../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageSharedVaultRootKeyChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged
  data: AsymmetricMessageDataCommon & { rootKey: KeySystemRootKeyContentSpecialized }
}
