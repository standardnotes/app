import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  isErrorResponse,
  GroupPermission,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface } from '@standardnotes/api'

export class UpdateGroupInviteUseCase {
  constructor(private vaultInvitesServer: GroupInvitesServerInterface) {}

  async execute(params: {
    groupUuid: string
    inviteUuid: string
    inviterPublicKey: string
    encryptedVaultKeyContent: string
    inviteType: GroupInviteType
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.updateInvite({
      groupUuid: params.groupUuid,
      inviteUuid: params.inviteUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultKeyContent: params.encryptedVaultKeyContent,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
