import { SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ReuploadInvite } from './ReuploadInvite'
import { FindContact } from '../../Contacts/UseCase/FindContact'

type ReuploadAllInvitesDTO = {
  keys: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
  previousKeys?: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
}

export class ReuploadAllInvites implements UseCaseInterface<void> {
  constructor(
    private reuploadInvite: ReuploadInvite,
    private findContact: FindContact,
    private inviteServer: SharedVaultInvitesServerInterface,
  ) {}

  async execute(params: ReuploadAllInvitesDTO): Promise<Result<void>> {
    const invites = await this.getExistingInvites()
    if (invites.isFailed()) {
      return invites
    }

    const deleteResult = await this.deleteExistingInvites()
    if (deleteResult.isFailed()) {
      return deleteResult
    }

    const errors: string[] = []

    for (const invite of invites.getValue()) {
      const recipient = this.findContact.execute({ userUuid: invite.user_uuid })
      if (recipient.isFailed()) {
        errors.push(`Contact not found for invite ${invite.user_uuid}`)
        continue
      }

      const result = await this.reuploadInvite.execute({
        keys: params.keys,
        previousKeys: params.previousKeys,
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

  private async getExistingInvites(): Promise<Result<SharedVaultInviteServerHash[]>> {
    const response = await this.inviteServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to get outbound user invites ${JSON.stringify(response)}`)
    }

    const invites = response.data.invites

    return Result.ok(invites)
  }

  private async deleteExistingInvites(): Promise<Result<void>> {
    const response = await this.inviteServer.deleteAllOutboundInvites()

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to delete existing invites ${JSON.stringify(response)}`)
    }

    return Result.ok()
  }
}
