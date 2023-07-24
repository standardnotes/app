import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { AsymmetricMessageSharedVaultInvite, SharedVaultListingInterface } from '@standardnotes/models'
import { SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { SendVaultKeyChangedMessage } from './SendVaultKeyChangedMessage'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { InviteToVault } from '../../VaultInvite/UseCase/InviteToVault'
import { GetVaultContacts } from '../../VaultUser/UseCase/GetVaultContacts'
import { DecryptOwnMessage } from '../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'
import { FindContact } from '../../Contacts/UseCase/FindContact'

type Params = {
  keys: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
  sharedVault: SharedVaultListingInterface
  senderUuid: string
}

export class NotifyVaultUsersOfKeyRotation implements UseCaseInterface<void> {
  constructor(
    private findContact: FindContact,
    private sendKeyChangedMessage: SendVaultKeyChangedMessage,
    private inviteToVault: InviteToVault,
    private inviteServer: SharedVaultInvitesServerInterface,
    private getVaultContacts: GetVaultContacts,
    private decryptOwnMessage: DecryptOwnMessage<AsymmetricMessageSharedVaultInvite>,
  ) {}

  async execute(params: Params): Promise<Result<void>> {
    await this.reinvitePendingInvites(params)

    await this.performSendKeyChangeMessage(params)

    return Result.ok()
  }

  private async reinvitePendingInvites(params: Params): Promise<Result<void>> {
    const existingInvites = await this.getExistingInvites(params.sharedVault.sharing.sharedVaultUuid)
    if (existingInvites.isFailed()) {
      return existingInvites
    }

    await this.deleteAllInvites(params.sharedVault.sharing.sharedVaultUuid)

    const contacts = await this.getVaultContacts.execute(params.sharedVault.sharing.sharedVaultUuid)

    for (const invite of existingInvites.getValue()) {
      const recipient = this.findContact.execute({ userUuid: invite.user_uuid })
      if (recipient.isFailed()) {
        continue
      }

      const decryptedPreviousInvite = this.decryptOwnMessage.execute({
        message: invite.encrypted_message,
        privateKey: params.keys.encryption.privateKey,
        recipientPublicKey: recipient.getValue().publicKeySet.encryption,
      })

      if (decryptedPreviousInvite.isFailed()) {
        return Result.fail(decryptedPreviousInvite.getError())
      }

      await this.inviteToVault.execute({
        keys: params.keys,
        sharedVault: params.sharedVault,
        sharedVaultContacts: !contacts.isFailed() ? contacts.getValue() : [],
        recipient: recipient.getValue(),
        permissions: invite.permissions,
        senderUuid: params.senderUuid,
      })
    }

    return Result.ok()
  }

  private async performSendKeyChangeMessage(params: Params): Promise<Result<void>> {
    const result = await this.sendKeyChangedMessage.execute({
      keySystemIdentifier: params.sharedVault.systemIdentifier,
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      senderUuid: params.senderUuid,
      keys: params.keys,
    })

    if (result.isFailed()) {
      return result
    }

    return Result.ok()
  }

  private async deleteAllInvites(sharedVaultUuid: string): Promise<Result<void>> {
    const response = await this.inviteServer.deleteAllSharedVaultInvites({
      sharedVaultUuid: sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to delete existing invites ${response}`)
    }

    return Result.ok()
  }

  private async getExistingInvites(sharedVaultUuid: string): Promise<Result<SharedVaultInviteServerHash[]>> {
    const response = await this.inviteServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to get outbound user invites ${response}`)
    }

    const invites = response.data.invites

    return Result.ok(invites.filter((invite) => invite.shared_vault_uuid === sharedVaultUuid))
  }
}
