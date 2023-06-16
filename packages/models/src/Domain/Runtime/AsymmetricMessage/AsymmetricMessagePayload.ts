import { KeySystemRootKeyContentSpecialized } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContentSpecialized } from '../../Syncable/TrustedContact/TrustedContactContent'
import { AsymmetricMessagePayloadType } from './AsymmetricMessagePayloadType'

export type AsymmetricMessageSharedVaultRootKeyChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged
  data: KeySystemRootKeyContentSpecialized
}

export type AsymmetricMessageSharedVaultMetadataChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged
  data: {
    name: string
    description?: string
  }
}

export type AsymmetricMessageTrustedContactShare = {
  type: AsymmetricMessagePayloadType.ContactShare
  data: TrustedContactContentSpecialized
}

export type AsymmetricMessageSenderKeypairChanged = {
  type: AsymmetricMessagePayloadType.SenderKeypairChanged
  data: {
    newEncryptionPublicKey: string
    newSigningPublicKey: string
  }
}

export type AsymmetricMessageSharedVaultInvite = {
  type: AsymmetricMessagePayloadType.SharedVaultInvite
  data: {
    rootKey: KeySystemRootKeyContentSpecialized
    trustedContacts: TrustedContactContentSpecialized[]
    metadata: {
      name: string
      description?: string
    }
  }
}

export type AsymmetricMessagePayload =
  | AsymmetricMessageSharedVaultRootKeyChanged
  | AsymmetricMessageTrustedContactShare
  | AsymmetricMessageSenderKeypairChanged
  | AsymmetricMessageSharedVaultInvite
  | AsymmetricMessageSharedVaultMetadataChanged
