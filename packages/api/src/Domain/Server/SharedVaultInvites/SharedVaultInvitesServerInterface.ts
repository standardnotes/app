import { HttpResponse } from '@standardnotes/responses'
import { AcceptInviteRequestParams } from '../../Request/SharedVaultInvites/AcceptInviteRequestParams'
import { AcceptInviteResponse } from '../../Response/SharedVaultInvites/AcceptInviteResponse'
import { CreateSharedVaultInviteParams } from '../../Request/SharedVaultInvites/CreateSharedVaultInviteParams'
import { CreateSharedVaultInviteResponse } from '../../Response/SharedVaultInvites/CreateSharedVaultInviteResponse'
import { DeclineInviteRequestParams } from '../../Request/SharedVaultInvites/DeclineInviteRequestParams'
import { DeclineInviteResponse } from '../../Response/SharedVaultInvites/DeclineInviteResponse'
import { DeleteInviteRequestParams } from '../../Request/SharedVaultInvites/DeleteInviteRequestParams'
import { DeleteInviteResponse } from '../../Response/SharedVaultInvites/DeleteInviteResponse'
import { GetSharedVaultInvitesRequestParams } from '../../Request/SharedVaultInvites/GetSharedVaultInvitesRequestParams'
import { GetSharedVaultInvitesResponse } from '../../Response/SharedVaultInvites/GetSharedVaultInvitesResponse'
import { GetUserInvitesResponse } from '../../Response/SharedVaultInvites/GetUserInvitesResponse'
import { UpdateSharedVaultInviteParams } from '../../Request/SharedVaultInvites/UpdateSharedVaultInviteParams'
import { UpdateSharedVaultInviteResponse } from '../../Response/SharedVaultInvites/UpdateSharedVaultInviteResponse'
import { DeleteAllSharedVaultInvitesRequestParams } from '../../Request/SharedVaultInvites/DeleteAllSharedVaultInvitesRequestParams'
import { DeleteAllSharedVaultInvitesResponse } from '../../Response/SharedVaultInvites/DeleteAllSharedVaultInvitesResponse'

export interface SharedVaultInvitesServerInterface {
  createInvite(params: CreateSharedVaultInviteParams): Promise<HttpResponse<CreateSharedVaultInviteResponse>>
  updateInvite(params: UpdateSharedVaultInviteParams): Promise<HttpResponse<UpdateSharedVaultInviteResponse>>
  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>>
  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>>

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>
  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>
  getSharedVaultInvites(
    params: GetSharedVaultInvitesRequestParams,
  ): Promise<HttpResponse<GetSharedVaultInvitesResponse>>

  deleteAllSharedVaultInvites(
    params: DeleteAllSharedVaultInvitesRequestParams,
  ): Promise<HttpResponse<DeleteAllSharedVaultInvitesResponse>>
  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>>
  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>>
  deleteAllOutboundInvites(): Promise<HttpResponse<{ success: boolean }>>
}
