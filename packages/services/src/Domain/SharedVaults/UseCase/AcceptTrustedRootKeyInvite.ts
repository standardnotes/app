import {
  KeySystemRootKeyContentSpecialized,
  KeySystemRootKeyInterface,
  KeySystemRootKeyMutator,
  SharedVaultMessageRootKey,
} from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { CreateKeySystemRootKeyUseCase } from '../../Vaults/UseCase/CreateKeySystemRootKey'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AcceptTrustedRootKeyInvite {
  constructor(private vaultInvitesServer: SharedVaultInvitesServerInterface, private items: ItemManagerInterface) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    decryptedMessage: SharedVaultMessageRootKey
  }): Promise<'inserted' | 'changed'> {
    const { modificationType } = await this.createOrUpdateKeySystemRootKey(dto.decryptedMessage.data)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })

    return modificationType
  }

  private async createOrUpdateKeySystemRootKey(
    keyContent: KeySystemRootKeyContentSpecialized,
  ): Promise<{ keySystemRootKey: KeySystemRootKeyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingKeySystemRootKey = this.items.getKeySystemRootKeyMatchingTimestamp(
      keyContent.systemIdentifier,
      keyContent.keyTimestamp,
    )

    if (existingKeySystemRootKey) {
      const updatedItem = await this.items.changeItem<KeySystemRootKeyMutator, KeySystemRootKeyInterface>(
        existingKeySystemRootKey,
        (mutator) => {
          mutator.systemName = keyContent.systemName
          mutator.systemDescription = keyContent.systemDescription
        },
      )

      return { modificationType: 'changed', keySystemRootKey: updatedItem }
    } else {
      const createKeySystemRootKey = new CreateKeySystemRootKeyUseCase(this.items)
      const newKeySystemRootKey = await createKeySystemRootKey.execute(keyContent)
      return { modificationType: 'inserted', keySystemRootKey: newKeySystemRootKey }
    }
  }
}
