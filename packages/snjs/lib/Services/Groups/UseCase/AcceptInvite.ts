import { GroupKeyContentSpecialized, GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
import { GroupInvitesServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { GroupInviteServerHash } from '@standardnotes/responses'
import { CreateGroupKeyUseCase } from './CreateGroupKey'

export class AcceptInvite {
  constructor(
    private privateKey: string,
    private groupInvitesServer: GroupInvitesServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(invite: GroupInviteServerHash): Promise<'inserted' | 'changed' | 'errored'> {
    const decryptionResult = this.encryption.decryptGroupDataWithPrivateKey(
      invite.encrypted_group_data,
      invite.inviter_public_key,
      this.privateKey,
    )

    if (!decryptionResult) {
      return 'errored'
    }

    const { modificationType } = await this.createOrUpdateGroupKey(invite, decryptionResult)

    await this.groupInvitesServer.acceptInvite({ groupUuid: invite.group_uuid, inviteUuid: invite.uuid })

    return modificationType
  }

  private async createOrUpdateGroupKey(
    invite: GroupInviteServerHash,
    decryptedKeyData: GroupKeyContentSpecialized,
  ): Promise<{ groupKey: GroupKeyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingGroupKey = this.encryption.getGroupKey(invite.group_uuid)

    if (existingGroupKey) {
      const updatedItem = await this.items.changeItem<GroupKeyMutator, GroupKeyInterface>(
        existingGroupKey,
        (mutator) => {
          mutator.content = decryptedKeyData
        },
      )

      return { modificationType: 'changed', groupKey: updatedItem }
    }

    const createGroupKey = new CreateGroupKeyUseCase(this.items)
    const newGroupKey = await createGroupKey.execute(decryptedKeyData)
    return { modificationType: 'inserted', groupKey: newGroupKey }
  }
}
