import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  isErrorResponse,
  GroupPermission,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface } from '@standardnotes/api'

export class CreateGroupInviteUseCase {
  constructor(private vaultInvitesServer: GroupInvitesServerInterface) {}

  async execute(params: {
    groupUuid: string
    inviteeUuid: string
    inviterPublicKey: string
    encryptedVaultKeyContent: string
    inviteType: GroupInviteType
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.createInvite({
      groupUuid: params.groupUuid,
      inviteeUuid: params.inviteeUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultKeyContent: params.encryptedVaultKeyContent,
      inviteType: params.inviteType,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
