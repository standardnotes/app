import { HttpResponse } from '@standardnotes/responses'
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
import { UpdateGroupInviteParams } from './../../Request/GroupInvites/UpdateGroupInviteParams'
import { UpdateGroupInviteResponse } from '../../Response/GroupInvites/UpdateGroupInviteResponse'

export interface GroupInvitesServerInterface {
  createInvite(params: CreateGroupInviteParams): Promise<HttpResponse<CreateGroupInviteResponse>>

  updateInvite(params: UpdateGroupInviteParams): Promise<HttpResponse<UpdateGroupInviteResponse>>

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>>

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>>

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>

  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>

  getGroupInvites(params: GetGroupInvitesRequestParams): Promise<HttpResponse<GetGroupInvitesResponse>>

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>>

  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>>
}
