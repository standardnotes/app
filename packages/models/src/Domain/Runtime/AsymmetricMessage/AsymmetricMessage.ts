import { KeySystemRootKeyContentSpecialized } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyContent'
import { TrustedContactContent } from '../../Syncable/TrustedContact/TrustedContactContent'

export enum AsymmetricMessagePayloadType {
  ContactShare = 'contact-share',
  SharedVaultRootKeyChanged = 'group-root-key-changed',
  SenderKeypairChanged = 'sender-keypair-changed',
}

export type AsymmetricMessageSharedVaultRootKeyChanged = {
  type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged
  data: KeySystemRootKeyContentSpecialized
}

export type AsymmetricMessageTrustedContactShare = {
  type: AsymmetricMessagePayloadType.ContactShare
  data: TrustedContactContent
}

export type AsymmetricMessageSenderKeypairChanged = {
  type: AsymmetricMessagePayloadType.SenderKeypairChanged
  data: {
    newEncryptionPublicKey: string
    newSigningPublicKey: string
  }
}

export type AsymmetricMessagePayload =
  | AsymmetricMessageSharedVaultRootKeyChanged
  | AsymmetricMessageTrustedContactShare
  | AsymmetricMessageSenderKeypairChanged
