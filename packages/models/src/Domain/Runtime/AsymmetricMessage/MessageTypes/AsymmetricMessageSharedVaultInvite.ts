import { KeySystemRootKeyContentSpecialized } from '../../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { ContactPublicKeySetJsonInterface } from '../../../Syncable/TrustedContact/PublicKeySet/ContactPublicKeySetJsonInterface'
import { EmojiString, IconType } from '../../../Utilities/Icon/IconType'
import { AsymmetricMessageDataCommon } from '../AsymmetricMessageDataCommon'
import { AsymmetricMessagePayloadType } from '../AsymmetricMessagePayloadType'

export type VaultInviteDelegatedContact = {
  name?: string
  contactUuid: string
  publicKeySet: ContactPublicKeySetJsonInterface
}

export type AsymmetricMessageSharedVaultInvite = {
  type: AsymmetricMessagePayloadType.SharedVaultInvite
  data: AsymmetricMessageDataCommon & {
    rootKey: KeySystemRootKeyContentSpecialized
    trustedContacts: VaultInviteDelegatedContact[]
    metadata: {
      name: string
      description?: string
      iconString: IconType | EmojiString
      fileBytesUsed: number
      designatedSurvivor: string | null
    }
  }
}
