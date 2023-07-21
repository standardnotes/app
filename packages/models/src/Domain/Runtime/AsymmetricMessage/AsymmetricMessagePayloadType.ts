export enum AsymmetricMessagePayloadType {
  ContactShare = 'contact-share',
  SharedVaultRootKeyChanged = 'shared-vault-root-key-changed',
  SenderKeypairChanged = 'sender-keypair-changed',
  SharedVaultMetadataChanged = 'shared-vault-metadata-changed',
  /**
   * Shared Vault Invites conform to the asymmetric message protocol, but are sent via the dedicated
   * SharedVaultInvite model and not the AsymmetricMessage model on the server side.
   */
  SharedVaultInvite = 'shared-vault-invite',
}
