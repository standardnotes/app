import { VaultKeyCopyContentSpecialized, VaultKeyCopyInterface, VaultKeyMutator } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { CreateVaultKeyUseCase } from '../../Vaults/UseCase/CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AcceptInvite {
  constructor(
    private privateKey: string,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(invite: SharedVaultInviteServerHash): Promise<'inserted' | 'changed' | 'errored'> {
    const decryptionResult = this.encryption.decryptVaultKeyContentWithPrivateKey(
      invite.encrypted_vault_key_content,
      invite.inviter_public_key,
      this.privateKey,
    )

    if (!decryptionResult) {
      return 'errored'
    }

    const { modificationType } = await this.createOrUpdateVaultKey(decryptionResult)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: invite.shared_vault_uuid,
      inviteUuid: invite.uuid,
    })

    return modificationType
  }

  private async createOrUpdateVaultKey(
    decryptedKeyContent: VaultKeyCopyContentSpecialized,
  ): Promise<{ vaultKey: VaultKeyCopyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingVaultKey = this.items.getSyncedVaultKeyCopyMatchingTimestamp(
      decryptedKeyContent.keySystemIdentifier,
      decryptedKeyContent.keyTimestamp,
    )

    if (existingVaultKey) {
      const updatedItem = await this.items.changeItem<VaultKeyMutator, VaultKeyCopyInterface>(
        existingVaultKey,
        (mutator) => {
          mutator.vaultName = decryptedKeyContent.vaultName
          mutator.vaultDescription = decryptedKeyContent.vaultDescription
        },
      )

      return { modificationType: 'changed', vaultKey: updatedItem }
    } else {
      const createVaultKey = new CreateVaultKeyUseCase(this.items)
      const newVaultKey = await createVaultKey.execute(decryptedKeyContent)
      return { modificationType: 'inserted', vaultKey: newVaultKey }
    }
  }
}
