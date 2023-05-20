import { HttpResponse } from '@standardnotes/responses'
import { CreateGroupInviteParams } from '../../Request/GroupInvites/CreateGroupInviteParams'
import { InviteUserToGroupResponse } from '../../Response/GroupInvites/InviteUserToGroupResponse'
import { AcceptInviteRequestParams } from '../../Request/GroupInvites/AcceptInviteRequestParams'
import { DeclineInviteRequestParams } from '../../Request/GroupInvites/DeclineInviteRequestParams'
import { GetGroupInvitesRequestParams } from '../../Request/GroupInvites/GetGroupInvitesRequestParams'
import { AcceptInviteResponse } from '../../Response/GroupInvites/AcceptInviteResponse'
import { DeclineInviteResponse } from '../../Response/GroupInvites/DeclineInviteResponse'
import { GetUserInvitesResponse } from '../../Response/GroupInvites/GetUserInvitesResponse'
import { GetGroupInvitesResponse } from '../../Response/GroupInvites/GetGroupInvitesResponse'
import { DeleteInviteResponse } from '../../Response/GroupInvites/DeleteInviteResponse'
import { DeleteInviteRequestParams } from '../../Request/GroupInvites/DeleteInviteRequestParams'

export interface GroupInvitesServerInterface {
  createInvite(params: CreateGroupInviteParams): Promise<HttpResponse<InviteUserToGroupResponse>>

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>>

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>>

  getUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>

  getGroupInvites(params: GetGroupInvitesRequestParams): Promise<HttpResponse<GetGroupInvitesResponse>>

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>>
}
