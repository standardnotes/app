import { AsymmetricMessageSenderKeypairChanged } from './MessageTypes/AsymmetricMessageSenderKeypairChanged'
import { AsymmetricMessageSharedVaultInvite } from './MessageTypes/AsymmetricMessageSharedVaultInvite'
import { AsymmetricMessageSharedVaultMetadataChanged } from './MessageTypes/AsymmetricMessageSharedVaultMetadataChanged'
import { AsymmetricMessageSharedVaultRootKeyChanged } from './MessageTypes/AsymmetricMessageSharedVaultRootKeyChanged'
import { AsymmetricMessageTrustedContactShare } from './MessageTypes/AsymmetricMessageTrustedContactShare'

export type AsymmetricMessagePayload =
  | AsymmetricMessageSharedVaultRootKeyChanged
  | AsymmetricMessageTrustedContactShare
  | AsymmetricMessageSenderKeypairChanged
  | AsymmetricMessageSharedVaultInvite
  | AsymmetricMessageSharedVaultMetadataChanged
