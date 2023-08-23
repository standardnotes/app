import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash, getErrorFromErrorResponse, isErrorResponse } from '@standardnotes/responses'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

import { ProcessAcceptedVaultInvite } from '../../AsymmetricMessage/UseCase/ProcessAcceptedVaultInvite'

export class AcceptVaultInvite implements UseCaseInterface<void> {
  constructor(
    private inviteServer: SharedVaultInvitesServerInterface,
    private processInvite: ProcessAcceptedVaultInvite,
  ) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    message: AsymmetricMessageSharedVaultInvite
  }): Promise<Result<void>> {
    const acceptResponse = await this.inviteServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })
    if (isErrorResponse(acceptResponse)) {
      return Result.fail(`Could not accept vault invitation: ${getErrorFromErrorResponse(acceptResponse).message}`)
    }

    await this.processInvite.execute(dto.message, dto.invite.shared_vault_uuid, dto.invite.sender_uuid)

    return Result.ok()
  }
}
