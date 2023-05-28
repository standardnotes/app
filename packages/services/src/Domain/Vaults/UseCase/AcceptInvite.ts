import { VaultKeyContentSpecialized, VaultKeyInterface, VaultKeyMutator } from '@standardnotes/models'
import { VaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { VaultInviteServerHash } from '@standardnotes/responses'
import { CreateVaultKeyUseCase } from './CreateVaultKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AcceptInvite {
  constructor(
    private privateKey: string,
    private vaultInvitesServer: VaultInvitesServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(invite: VaultInviteServerHash): Promise<'inserted' | 'changed' | 'errored'> {
    const decryptionResult = this.encryption.decryptVaultDataWithPrivateKey(
      invite.encrypted_vault_data,
      invite.inviter_public_key,
      this.privateKey,
    )

    if (!decryptionResult) {
      return 'errored'
    }

    const { modificationType } = await this.createOrUpdateVaultKey(invite, decryptionResult)

    await this.vaultInvitesServer.acceptInvite({ vaultUuid: invite.vault_uuid, inviteUuid: invite.uuid })

    return modificationType
  }

  private async createOrUpdateVaultKey(
    invite: VaultInviteServerHash,
    decryptedKeyData: VaultKeyContentSpecialized,
  ): Promise<{ vaultKey: VaultKeyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingVaultKey = this.encryption.getVaultKey(invite.vault_uuid)

    if (existingVaultKey) {
      const updatedItem = await this.items.changeItem<VaultKeyMutator, VaultKeyInterface>(
        existingVaultKey,
        (mutator) => {
          mutator.content = decryptedKeyData
        },
      )

      return { modificationType: 'changed', vaultKey: updatedItem }
    }

    const createVaultKey = new CreateVaultKeyUseCase(this.items)
    const newVaultKey = await createVaultKey.execute(decryptedKeyData)
    return { modificationType: 'inserted', vaultKey: newVaultKey }
  }
}
