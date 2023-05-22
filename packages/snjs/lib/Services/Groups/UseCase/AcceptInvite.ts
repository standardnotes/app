import { ProtocolVersion } from '@standardnotes/common'
import { GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
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
    const decryptionResult = this.encryption.decryptGroupKeyWithPrivateKey(
      invite.encrypted_group_key,
      invite.inviter_public_key,
      this.privateKey,
    )

    if (!decryptionResult) {
      return 'errored'
    }

    const { modificationType } = await this.createOrUpdateGroupKey(
      invite,
      decryptionResult.decryptedKey,
      decryptionResult.keyVersion,
    )

    await this.groupInvitesServer.acceptInvite({ groupUuid: invite.group_uuid, inviteUuid: invite.uuid })

    return modificationType
  }

  private async createOrUpdateGroupKey(
    invite: GroupInviteServerHash,
    decryptedKey: string,
    keyVersion: ProtocolVersion,
  ): Promise<{ groupKey: GroupKeyInterface; modificationType: 'inserted' | 'changed' }> {
    const existingGroupKey = this.encryption.getGroupKey(invite.group_uuid)

    if (existingGroupKey) {
      const updatedItem = await this.items.changeItem<GroupKeyMutator, GroupKeyInterface>(
        existingGroupKey,
        (mutator) => {
          mutator.groupKey = decryptedKey
        },
      )
      return { modificationType: 'changed', groupKey: updatedItem }
    }

    const createGroupKey = new CreateGroupKeyUseCase(this.items)

    const newGroupKey = await createGroupKey.execute({
      groupUuid: invite.group_uuid,
      groupKey: decryptedKey,
      keyVersion,
    })

    return { modificationType: 'inserted', groupKey: newGroupKey }
  }
}
