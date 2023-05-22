import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  isErrorResponse,
  GroupPermission,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface } from '@standardnotes/api'

export class UpdateGroupInviteUseCase {
  constructor(private groupInvitesServer: GroupInvitesServerInterface) {}

  async execute(params: {
    groupUuid: string
    inviteUuid: string
    inviterPublicKey: string
    encryptedGroupKey: string
    inviteType: GroupInviteType
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const response = await this.groupInvitesServer.updateInvite({
      groupUuid: params.groupUuid,
      inviteUuid: params.inviteUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedGroupKey: params.encryptedGroupKey,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
