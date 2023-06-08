import { KeySystemRootKeyContentSpecialized } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContentSpecialized } from '../../Syncable/TrustedContact/TrustedContactContent'

export enum AsymmetricMessagePayloadType {
  ContactShare = 'contact-share',
  SharedVaultRootKeyChanged = 'shared-vault-root-key-changed',
  SenderKeypairChanged = 'sender-keypair-changed',
  SharedVaultInvite = 'shared-vault-invite',
}

export type AsymmetricMessageSharedVaultRootKeyChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged
  data: KeySystemRootKeyContentSpecialized
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
  }
}

export type AsymmetricMessagePayload =
  | AsymmetricMessageSharedVaultRootKeyChanged
  | AsymmetricMessageTrustedContactShare
  | AsymmetricMessageSenderKeypairChanged
  | AsymmetricMessageSharedVaultInvite
