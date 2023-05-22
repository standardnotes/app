import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  GroupServerHash,
  GroupPermission,
} from '@standardnotes/responses'
import { TrustedContactInterface } from '@standardnotes/models'
import { GroupInvitesServerInterface } from '@standardnotes/api'
import { CreateGroupInviteUseCase } from './CreateInvite'

export class AddContactToGroupUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private groupInvitesServer: GroupInvitesServerInterface,
  ) {}

  async execute(params: {
    inviterPrivateKey: string
    inviterPublicKey: string
    group: GroupServerHash
    contact: TrustedContactInterface
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const groupKey = this.encryption.getGroupKey(params.group.uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      groupKey.groupKey,
      params.inviterPrivateKey,
      params.contact.publicKey,
    )

    const createInviteUseCase = new CreateGroupInviteUseCase(this.groupInvitesServer)
    const createInviteResult = await createInviteUseCase.execute({
      groupUuid: params.group.uuid,
      inviteeUuid: params.contact.userUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedGroupKey,
      inviteType: GroupInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
