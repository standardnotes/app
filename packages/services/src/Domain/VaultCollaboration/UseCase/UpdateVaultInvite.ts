import {
  ClientDisplayableError,
  VaultInviteServerHash,
  VaultInviteType,
  isErrorResponse,
  VaultPermission,
} from '@standardnotes/responses'
import { VaultInvitesServerInterface } from '@standardnotes/api'

export class UpdateVaultInviteUseCase {
  constructor(private vaultInvitesServer: VaultInvitesServerInterface) {}

  async execute(params: {
    vaultUuid: string
    inviteUuid: string
    inviterPublicKey: string
    encryptedVaultData: string
    inviteType: VaultInviteType
    permissions: VaultPermission
  }): Promise<VaultInviteServerHash | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.updateInvite({
      vaultUuid: params.vaultUuid,
      inviteUuid: params.inviteUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultData: params.encryptedVaultData,
      permissions: params.permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.invite
  }
}
