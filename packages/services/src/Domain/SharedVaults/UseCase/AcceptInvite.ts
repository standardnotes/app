import {
  KeySystemRootKeyContentSpecialized,
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
} from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { CreateKeySystemRootKeyUseCase } from '../../Vaults/UseCase/CreateKeySystemRootKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AcceptInvite {
  constructor(
    private privateKey: string,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(invite: SharedVaultInviteServerHash): Promise<'inserted' | 'changed' | 'errored'> {
    const decryptionResult = this.encryption.asymmetricallyDecryptSharedVaultMessage(
      invite.encrypted_vault_key_content,
      invite.inviter_public_key,
      this.privateKey,
    )

    if (!decryptionResult) {
      return 'errored'
    }

    const { modificationType } = await this.createOrUpdateKeySystemRootKey(decryptionResult)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: invite.shared_vault_uuid,
      inviteUuid: invite.uuid,
    })

    return modificationType
  }

  private async createOrUpdateKeySystemRootKey(
    decryptedKeyContent: KeySystemRootKeyContentSpecialized,
  ): Promise<{ keySystemRootKey: KeySystemRootKeyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingKeySystemRootKey = this.items.getKeySystemRootKeyMatchingTimestamp(
      decryptedKeyContent.systemIdentifier,
      decryptedKeyContent.keyTimestamp,
    )

    if (existingKeySystemRootKey) {
      const updatedItem = await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = decryptedKeyContent.systemName
          mutator.systemDescription = decryptedKeyContent.systemDescription
        },
      )

      return { modificationType: 'changed', keySystemRootKey: updatedItem }
    } else {
      const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
      const newKeySystemRootKey = await createKeySystemRootKey.execute(decryptedKeyContent)
      return { modificationType: 'inserted', keySystemRootKey: newKeySystemRootKey }
    }
  }
}
