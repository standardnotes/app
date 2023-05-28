import { HttpResponse } from '@standardnotes/responses'
import { AcceptInviteRequestParams } from '../../Request/VaultInvites/AcceptInviteRequestParams'
import { AcceptInviteResponse } from '../../Response/VaultInvites/AcceptInviteResponse'
import { CreateVaultInviteParams } from '../../Request/VaultInvites/CreateVaultInviteParams'
import { CreateVaultInviteResponse } from '../../Response/VaultInvites/CreateVaultInviteResponse'
import { DeclineInviteRequestParams } from '../../Request/VaultInvites/DeclineInviteRequestParams'
import { DeclineInviteResponse } from '../../Response/VaultInvites/DeclineInviteResponse'
import { DeleteInviteRequestParams } from '../../Request/VaultInvites/DeleteInviteRequestParams'
import { DeleteInviteResponse } from '../../Response/VaultInvites/DeleteInviteResponse'
import { GetVaultInvitesRequestParams } from '../../Request/VaultInvites/GetVaultInvitesRequestParams'
import { GetVaultInvitesResponse } from '../../Response/VaultInvites/GetVaultInvitesResponse'
import { GetUserInvitesResponse } from '../../Response/VaultInvites/GetUserInvitesResponse'
import { UpdateVaultInviteParams } from '../../Request/VaultInvites/UpdateVaultInviteParams'
import { UpdateVaultInviteResponse } from '../../Response/VaultInvites/UpdateVaultInviteResponse'

export interface VaultInvitesServerInterface {
  createInvite(params: CreateVaultInviteParams): Promise<HttpResponse<CreateVaultInviteResponse>>

  updateInvite(params: UpdateVaultInviteParams): Promise<HttpResponse<UpdateVaultInviteResponse>>

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>>

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>>

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>

  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>>

  getVaultInvites(params: GetVaultInvitesRequestParams): Promise<HttpResponse<GetVaultInvitesResponse>>

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>>

  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>>
}
