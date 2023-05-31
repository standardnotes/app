import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'

import { AcceptInviteRequestParams } from '../../Request/GroupInvites/AcceptInviteRequestParams'
import { AcceptInviteResponse } from '../../Response/GroupInvites/AcceptInviteResponse'
import { CreateGroupInviteParams } from '../../Request/GroupInvites/CreateGroupInviteParams'
import { CreateGroupInviteResponse } from '../../Response/GroupInvites/CreateGroupInviteResponse'
import { DeclineInviteRequestParams } from '../../Request/GroupInvites/DeclineInviteRequestParams'
import { DeclineInviteResponse } from '../../Response/GroupInvites/DeclineInviteResponse'
import { DeleteInviteRequestParams } from '../../Request/GroupInvites/DeleteInviteRequestParams'
import { DeleteInviteResponse } from '../../Response/GroupInvites/DeleteInviteResponse'
import { GetGroupInvitesRequestParams } from '../../Request/GroupInvites/GetGroupInvitesRequestParams'
import { GetGroupInvitesResponse } from '../../Response/GroupInvites/GetGroupInvitesResponse'
import { GetUserInvitesResponse } from '../../Response/GroupInvites/GetUserInvitesResponse'
import { GroupInvitesPaths } from './Paths'
import { GroupInvitesServerInterface } from './GroupInvitesServerInterface'
import { UpdateGroupInviteParams } from '../../Request/GroupInvites/UpdateGroupInviteParams'
import { UpdateGroupInviteResponse } from '../../Response/GroupInvites/UpdateGroupInviteResponse'

export class GroupInvitesServer implements GroupInvitesServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createInvite(params: CreateGroupInviteParams): Promise<HttpResponse<CreateGroupInviteResponse>> {
    return this.httpService.post(GroupInvitesPaths.createInvite(params.groupUuid), {
      invitee_uuid: params.inviteeUuid,
      inviter_public_key: params.inviterPublicKey,
      encrypted_vault_key_content: params.encryptedVaultKeyContent,
      invite_type: params.inviteType,
      permissions: params.permissions,
    })
  }

  updateInvite(params: UpdateGroupInviteParams): Promise<HttpResponse<UpdateGroupInviteResponse>> {
    return this.httpService.patch(GroupInvitesPaths.updateInvite(params.groupUuid, params.inviteUuid), {
      inviter_public_key: params.inviterPublicKey,
      encrypted_vault_key_content: params.encryptedVaultKeyContent,
      permissions: params.permissions,
    })
  }

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>> {
    return this.httpService.post(GroupInvitesPaths.acceptInvite(params.groupUuid, params.inviteUuid))
  }

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>> {
    return this.httpService.post(GroupInvitesPaths.declineInvite(params.groupUuid, params.inviteUuid))
  }

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(GroupInvitesPaths.getInboundUserInvites())
  }

  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(GroupInvitesPaths.getOutboundUserInvites())
  }

  getGroupInvites(params: GetGroupInvitesRequestParams): Promise<HttpResponse<GetGroupInvitesResponse>> {
    return this.httpService.get(GroupInvitesPaths.getGroupInvites(params.groupUuid))
  }

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>> {
    return this.httpService.delete(GroupInvitesPaths.deleteInvite(params.groupUuid, params.inviteUuid))
  }

  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>> {
    return this.httpService.delete(GroupInvitesPaths.deleteAllInboundInvites)
  }
}
