import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { GroupInvitesServerInterface } from './GroupInvitesServerInterface'
import { CreateGroupInviteParams } from '../../Request/GroupInvites/CreateGroupInviteParams'
import { InviteUserToGroupResponse } from '../../Response/GroupInvites/InviteUserToGroupResponse'
import { GroupInvitesPaths } from './Paths'
import { AcceptInviteRequestParams } from '../../Request/GroupInvites/AcceptInviteRequestParams'
import { DeclineInviteRequestParams } from '../../Request/GroupInvites/DeclineInviteRequestParams'
import { GetGroupInvitesRequestParams } from '../../Request/GroupInvites/GetGroupInvitesRequestParams'
import { AcceptInviteResponse } from '../../Response/GroupInvites/AcceptInviteResponse'
import { DeclineInviteResponse } from '../../Response/GroupInvites/DeclineInviteResponse'
import { GetUserInvitesResponse } from '../../Response/GroupInvites/GetUserInvitesResponse'
import { GetGroupInvitesResponse } from '../../Response/GroupInvites/GetGroupInvitesResponse'
import { DeleteInviteResponse } from '../../Response/GroupInvites/DeleteInviteResponse'
import { DeleteInviteRequestParams } from '../../Request/GroupInvites/DeleteInviteRequestParams'

export class GroupInvitesServer implements GroupInvitesServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createInvite(params: CreateGroupInviteParams): Promise<HttpResponse<InviteUserToGroupResponse>> {
    return this.httpService.post(GroupInvitesPaths.createInvite(params.groupUuid), {
      invitee_uuid: params.inviteeUuid,
      inviter_public_key: params.inviterPublicKey,
      encrypted_group_key: params.encryptedGroupKey,
      invite_type: params.inviteType,
      permissions: params.permissions,
    })
  }

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>> {
    return this.httpService.post(GroupInvitesPaths.acceptInvite(params.groupUuid, params.inviteUuid))
  }

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>> {
    return this.httpService.post(GroupInvitesPaths.declineInvite(params.groupUuid, params.inviteUuid))
  }

  getUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(GroupInvitesPaths.getUserInvites())
  }

  getGroupInvites(params: GetGroupInvitesRequestParams): Promise<HttpResponse<GetGroupInvitesResponse>> {
    return this.httpService.get(GroupInvitesPaths.getGroupInvites(params.groupUuid))
  }

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>> {
    return this.httpService.delete(GroupInvitesPaths.deleteInvite(params.groupUuid, params.inviteUuid))
  }
}
