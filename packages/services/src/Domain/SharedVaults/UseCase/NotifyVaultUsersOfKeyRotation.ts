import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { AsymmetricMessageSharedVaultInvite, SharedVaultListingInterface } from '@standardnotes/models'
import { SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { SendVaultKeyChangedMessage } from './SendVaultKeyChangedMessage'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { InviteToVault } from './InviteToVault'
import { GetVaultContacts } from './GetVaultContacts'
import { DecryptOwnMessage } from '../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'

type Params = {
  keys: {
    encryption: PkcKeyPair
    signing: PkcKeyPair
  }
  sharedVault: SharedVaultListingInterface
  userUuid: string
}

export class NotifyVaultUsersOfKeyRotation implements UseCaseInterface<void> {
  constructor(
    private contacts: ContactServiceInterface,
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
      const recipient = this.contacts.findTrustedContact(invite.user_uuid)
      if (!recipient) {
        continue
      }

      const decryptedPreviousInvite = this.decryptOwnMessage.execute({
        message: invite.encrypted_message,
        privateKey: params.keys.encryption.privateKey,
        recipientPublicKey: recipient.publicKeySet.encryption,
      })

      if (decryptedPreviousInvite.isFailed()) {
        return Result.fail(decryptedPreviousInvite.getError())
      }

      await this.inviteToVault.execute({
        keys: params.keys,
        sharedVault: params.sharedVault,
        sharedVaultContacts: contacts ?? [],
        recipient: recipient,
        permissions: invite.permissions,
      })
    }

    return Result.ok()
  }

  private async performSendKeyChangeMessage(params: Params): Promise<Result<void>> {
    const result = await this.sendKeyChangedMessage.execute({
      keySystemIdentifier: params.sharedVault.systemIdentifier,
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      senderUuid: params.userUuid,
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
