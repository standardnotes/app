import { ProtocolVersion } from '@standardnotes/common'
import { GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
import { GroupInvitesServerInterface } from '@standardnotes/api'
import { ItemManagerInterface } from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { GroupInviteServerHash } from '@standardnotes/responses'
import { CreateGroupKeyUseCase } from './CreateGroupKey'

/**
 * When new invites are received, we want to:
 * 1. Accept the invite
 * 2. Create or update a GroupKey model with the decrypted value of the invite key
 */
export class HandleTrustedInboundInvites {
  constructor(
    private privateKey: string,
    private groupInvitesServer: GroupInvitesServerInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(
    invites: GroupInviteServerHash[],
  ): Promise<{ inserted: GroupKeyInterface[]; changed: GroupKeyInterface[]; errored: GroupInviteServerHash[] }> {
    if (invites.length === 0) {
      return {
        inserted: [],
        changed: [],
        errored: [],
      }
    }

    const inserted: GroupKeyInterface[] = []
    const changed: GroupKeyInterface[] = []
    const errored: GroupInviteServerHash[] = []

    for (const invite of invites) {
      const decryptionResult = this.encryption.decryptGroupKeyWithPrivateKey(
        invite.encrypted_group_key,
        invite.inviter_public_key,
        this.privateKey,
      )

      if (!decryptionResult) {
        errored.push(invite)
        continue
      }

      const { groupKey, modificationType } = await this.createOrUpdateGroupKey(
        invite,
        decryptionResult.decryptedKey,
        decryptionResult.keyVersion,
      )

      if (modificationType === 'changed') {
        changed.push(groupKey)
      } else {
        inserted.push(groupKey)
      }

      await this.groupInvitesServer.acceptInvite({ groupUuid: invite.group_uuid, inviteUuid: invite.uuid })
    }

    return { inserted, changed, errored }
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
