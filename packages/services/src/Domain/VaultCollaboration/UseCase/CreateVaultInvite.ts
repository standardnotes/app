import {
  ClientDisplayableError,
  VaultInviteServerHash,
  VaultInviteType,
  isErrorResponse,
  VaultPermission,
} from '@standardnotes/responses'
import { VaultInvitesServerInterface } from '@standardnotes/api'

export class CreateVaultInviteUseCase {
  constructor(private vaultInvitesServer: VaultInvitesServerInterface) {}

  async execute(params: {
    vaultUuid: string
    inviteeUuid: string
    inviterPublicKey: string
    encryptedVaultData: string
    inviteType: VaultInviteType
    permissions: VaultPermission
  }): Promise<VaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.createInvite({
      vaultUuid: params.vaultUuid,
      inviteeUuid: params.inviteeUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultData: params.encryptedVaultData,
      inviteType: params.inviteType,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
