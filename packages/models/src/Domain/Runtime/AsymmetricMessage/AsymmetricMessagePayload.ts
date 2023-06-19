import { KeySystemRootKeyContentSpecialized } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContentSpecialized } from '../../Syncable/TrustedContact/TrustedContactContent'
import { AsymmetricMessagePayloadType } from './AsymmetricMessagePayloadType'

type DataCommon = {
  recipientUuid: string
}

export type AsymmetricMessageSharedVaultRootKeyChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged
  data: DataCommon & { rootKey: KeySystemRootKeyContentSpecialized }
}

export type AsymmetricMessageSharedVaultMetadataChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged
  data: DataCommon & {
    sharedVaultUuid: string
    name: string
    description?: string
  }
}

export type AsymmetricMessageTrustedContactShare = {
  type: AsymmetricMessagePayloadType.ContactShare
  data: DataCommon & { trustedContact: TrustedContactContentSpecialized }
}

export type AsymmetricMessageSenderKeypairChanged = {
  type: AsymmetricMessagePayloadType.SenderKeypairChanged
  data: DataCommon & {
    newEncryptionPublicKey: string
    newSigningPublicKey: string
  }
}

export type AsymmetricMessageSharedVaultInvite = {
  type: AsymmetricMessagePayloadType.SharedVaultInvite
  data: DataCommon & {
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
