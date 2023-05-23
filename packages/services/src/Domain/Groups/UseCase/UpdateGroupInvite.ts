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
    encryptedGroupData: string
    inviteType: GroupInviteType
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const response = await this.groupInvitesServer.updateInvite({
      groupUuid: params.groupUuid,
      inviteUuid: params.inviteUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedGroupData: params.encryptedGroupData,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
