import { KeySystemRootKeyContentSpecialized } from '../../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContentSpecialized } from '../../../Syncable/TrustedContact/TrustedContactContent'
import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type AsymmetricMessageSharedVaultInvite = {
  type: AsymmetricMessagePayloadType.SharedVaultInvite
  data: AsymmetricMessageDataCommon & {
    rootKey: KeySystemRootKeyContentSpecialized
    trustedContacts: TrustedContactContentSpecialized[]
    metadata: {
      name: string
      description?: string
    }
  }
}
