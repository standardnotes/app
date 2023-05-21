import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  isErrorResponse,
  GroupPermission,
} from '@standardnotes/responses'
import { GroupInvitesServerInterface } from '@standardnotes/api'

export class CreateGroupInviteUseCase {
  constructor(private groupInvitesServer: GroupInvitesServerInterface) {}

  async execute(params: {
    groupUuid: string
    inviteeUuid: string
    inviterPublicKey: string
    encryptedGroupKey: string
    inviteType: GroupInviteType
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const response = await this.groupInvitesServer.createInvite({
      groupUuid: params.groupUuid,
      inviteeUuid: params.inviteeUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedGroupKey: params.encryptedGroupKey,
      inviteType: params.inviteType,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
