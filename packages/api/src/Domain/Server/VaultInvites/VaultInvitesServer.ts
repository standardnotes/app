import { HttpResponse } from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'

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
import { VaultInvitesPaths } from './Paths'
import { VaultInvitesServerInterface } from './VaultInvitesServerInterface'
import { UpdateVaultInviteParams } from '../../Request/VaultInvites/UpdateVaultInviteParams'
import { UpdateVaultInviteResponse } from '../../Response/VaultInvites/UpdateVaultInviteResponse'

export class VaultInvitesServer implements VaultInvitesServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  createInvite(params: CreateVaultInviteParams): Promise<HttpResponse<CreateVaultInviteResponse>> {
    return this.httpService.post(VaultInvitesPaths.createInvite(params.vaultUuid), {
      invitee_uuid: params.inviteeUuid,
      inviter_public_key: params.inviterPublicKey,
      encrypted_vault_data: params.encryptedVaultData,
      invite_type: params.inviteType,
      permissions: params.permissions,
    })
  }

  updateInvite(params: UpdateVaultInviteParams): Promise<HttpResponse<UpdateVaultInviteResponse>> {
    return this.httpService.patch(VaultInvitesPaths.updateInvite(params.vaultUuid, params.inviteUuid), {
      inviter_public_key: params.inviterPublicKey,
      encrypted_vault_data: params.encryptedVaultData,
      permissions: params.permissions,
    })
  }

  acceptInvite(params: AcceptInviteRequestParams): Promise<HttpResponse<AcceptInviteResponse>> {
    return this.httpService.post(VaultInvitesPaths.acceptInvite(params.vaultUuid, params.inviteUuid))
  }

  declineInvite(params: DeclineInviteRequestParams): Promise<HttpResponse<DeclineInviteResponse>> {
    return this.httpService.post(VaultInvitesPaths.declineInvite(params.vaultUuid, params.inviteUuid))
  }

  getInboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(VaultInvitesPaths.getInboundUserInvites())
  }

  getOutboundUserInvites(): Promise<HttpResponse<GetUserInvitesResponse>> {
    return this.httpService.get(VaultInvitesPaths.getOutboundUserInvites())
  }

  getVaultInvites(params: GetVaultInvitesRequestParams): Promise<HttpResponse<GetVaultInvitesResponse>> {
    return this.httpService.get(VaultInvitesPaths.getVaultInvites(params.vaultUuid))
  }

  deleteInvite(params: DeleteInviteRequestParams): Promise<HttpResponse<DeleteInviteResponse>> {
    return this.httpService.delete(VaultInvitesPaths.deleteInvite(params.vaultUuid, params.inviteUuid))
  }

  deleteAllInboundInvites(): Promise<HttpResponse<{ success: boolean }>> {
    return this.httpService.delete(VaultInvitesPaths.deleteAllInboundInvites)
  }
}
