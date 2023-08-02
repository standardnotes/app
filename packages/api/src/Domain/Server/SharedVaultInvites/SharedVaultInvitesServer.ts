import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'

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
import { SharedVaultInvitesPaths } from './Paths'
import { SharedVaultInvitesServerInterface } from './SharedVaultInvitesServerInterface'
import { UpdateSharedVaultInviteParams } from '../../Request/SharedVaultInvites/UpdateSharedVaultInviteParams'
import { UpdateSharedVaultInviteResponse } from '../../Response/SharedVaultInvites/UpdateSharedVaultInviteResponse'
import { DeleteAllSharedVaultInvitesRequestParams } from '../../Request/SharedVaultInvites/DeleteAllSharedVaultInvitesRequestParams'
import { DeleteAllSharedVaultInvitesResponse } from '../../Response/SharedVaultInvites/DeleteAllSharedVaultInvitesResponse'

export class SharedVaultInvitesServer implements SharedVaultInvitesServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createInvite(params: CreateSharedVaultInviteParams): Promise<HttpResponse<CreateSharedVaultInviteResponse>> {
    return this.httpService.post(SharedVaultInvitesPaths.createInvite(params.sharedVaultUuid), {
      recipient_uuid: params.recipientUuid,
      encrypted_message: params.encryptedMessage,
      permission: params.permission.value,
    })
  }

  updateInvite(params: UpdateSharedVaultInviteParams): Promise<HttpResponse<UpdateSharedVaultInviteResponse>> {
    return this.httpService.patch(SharedVaultInvitesPaths.updateInvite(params.sharedVaultUuid, params.inviteUuid), {
      encrypted_message: params.encryptedMessage,
      permission: params.permission?.value,
    })
  }

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>> {
    return this.httpService.post(SharedVaultInvitesPaths.acceptInvite(params.sharedVaultUuid, params.inviteUuid))
  }

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>> {
    return this.httpService.post(SharedVaultInvitesPaths.declineInvite(params.sharedVaultUuid, params.inviteUuid))
  }

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(SharedVaultInvitesPaths.getInboundUserInvites())
  }

  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(SharedVaultInvitesPaths.getOutboundUserInvites())
  }

  getSharedVaultInvites(
    params: GetSharedVaultInvitesRequestParams,
  ): Promise<HttpResponse<GetSharedVaultInvitesResponse>> {
    return this.httpService.get(SharedVaultInvitesPaths.getSharedVaultInvites(params.sharedVaultUuid))
  }

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>> {
    return this.httpService.delete(SharedVaultInvitesPaths.deleteInvite(params.sharedVaultUuid, params.inviteUuid))
  }

  deleteAllSharedVaultInvites(
    params: DeleteAllSharedVaultInvitesRequestParams,
  ): Promise<HttpResponse<DeleteAllSharedVaultInvitesResponse>> {
    return this.httpService.delete(SharedVaultInvitesPaths.deleteAllSharedVaultInvites(params.sharedVaultUuid))
  }

  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>> {
    return this.httpService.delete(SharedVaultInvitesPaths.deleteAllInboundInvites)
  }

  deleteAllOutboundInvites(): Promise<HttpResponse<{ success: boolean }>> {
    return this.httpService.delete(SharedVaultInvitesPaths.deleteAllOutboundInvites)
  }
}
