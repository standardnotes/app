import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { ProcessAcceptedVaultInvite } from '../../AsymmetricMessage/UseCase/ProcessAcceptedVaultInvite'

export class AcceptVaultInvite {
  constructor(
    private inviteServer: SharedVaultInvitesServerInterface,
    private processInvite: ProcessAcceptedVaultInvite,
  ) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    message: AsymmetricMessageSharedVaultInvite
  }): Promise<void> {
    await this.processInvite.execute(dto.message, dto.invite.shared_vault_uuid, dto.invite.sender_uuid)

    await this.inviteServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })
  }
}
