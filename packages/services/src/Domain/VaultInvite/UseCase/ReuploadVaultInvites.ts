import { SharedVaultListingInterface } from '@standardnotes/models'
import { SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ReuploadInvite } from './ReuploadInvite'
import { FindContact } from '../../Contacts/UseCase/FindContact'

type ReuploadVaultInvitesDTO = {
  sharedVault: SharedVaultListingInterface
  senderUuid: string
  keys: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
}

export class ReuploadVaultInvites implements UseCaseInterface<void> {
  constructor(
    private reuploadInvite: ReuploadInvite,
    private findContact: FindContact,
    private inviteServer: SharedVaultInvitesServerInterface,
  ) {}

  async execute(params: ReuploadVaultInvitesDTO): Promise<Result<void>> {
    const existingInvites = await this.getExistingInvites(params.sharedVault.sharing.sharedVaultUuid)
    if (existingInvites.isFailed()) {
      return existingInvites
    }

    const deleteResult = await this.deleteExistingInvites(params.sharedVault.sharing.sharedVaultUuid)
    if (deleteResult.isFailed()) {
      return deleteResult
    }

    const errors: string[] = []

    for (const invite of existingInvites.getValue()) {
      const recipient = this.findContact.execute({ userUuid: invite.user_uuid })
      if (recipient.isFailed()) {
        errors.push(`Contact not found for invite ${invite.user_uuid}`)
        continue
      }

      const result = await this.reuploadInvite.execute({
        keys: params.keys,
        recipient: recipient.getValue(),
        previousInvite: invite,
      })

      if (result.isFailed()) {
        errors.push(result.getError())
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }

  private async getExistingInvites(sharedVaultUuid: string): Promise<Result<SharedVaultInviteServerHash[]>> {
    const response = await this.inviteServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to get outbound user invites ${JSON.stringify(response)}`)
    }

    const invites = response.data.invites

    return Result.ok(invites.filter((invite) => invite.shared_vault_uuid === sharedVaultUuid))
  }

  private async deleteExistingInvites(sharedVaultUuid: string): Promise<Result<void>> {
    const response = await this.inviteServer.deleteAllSharedVaultInvites({
      sharedVaultUuid: sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to delete existing invites ${JSON.stringify(response)}`)
    }

    return Result.ok()
  }
}
