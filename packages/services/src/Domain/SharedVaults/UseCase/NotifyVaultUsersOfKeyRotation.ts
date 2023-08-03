import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { AsymmetricMessageSharedVaultInvite, SharedVaultListingInterface } from '@standardnotes/models'
import { SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { SendVaultKeyChangedMessage } from './SendVaultKeyChangedMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { InviteToVault } from '../../VaultInvite/UseCase/InviteToVault'
import { GetVaultContacts } from '../../VaultUser/UseCase/GetVaultContacts'
import { DecryptOwnMessage } from '../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { GetKeyPairs } from '../../Encryption/UseCase/GetKeyPairs'

type Params = {
  sharedVault: SharedVaultListingInterface
}

export class NotifyVaultUsersOfKeyRotation implements UseCaseInterface<void> {
  constructor(
    private _findContact: FindContact,
    private _sendKeyChangedMessage: SendVaultKeyChangedMessage,
    private _inviteToVault: InviteToVault,
    private _inviteServer: SharedVaultInvitesServerInterface,
    private _getVaultContacts: GetVaultContacts,
    private _decryptOwnMessage: DecryptOwnMessage<AsymmetricMessageSharedVaultInvite>,
    private _getKeyPairs: GetKeyPairs,
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

    const contacts = await this._getVaultContacts.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      readFromCache: false,
    })

    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail('Cannot send metadata changed message; keys not found')
    }

    for (const invite of existingInvites.getValue()) {
      const recipient = this._findContact.execute({ userUuid: invite.user_uuid })
      if (recipient.isFailed()) {
        continue
      }

      const decryptedPreviousInvite = this._decryptOwnMessage.execute({
        message: invite.encrypted_message,
        privateKey: keys.getValue().encryption.privateKey,
        recipientPublicKey: recipient.getValue().publicKeySet.encryption,
      })

      if (decryptedPreviousInvite.isFailed()) {
        return Result.fail(decryptedPreviousInvite.getError())
      }

      await this._inviteToVault.execute({
        sharedVault: params.sharedVault,
        sharedVaultContacts: !contacts.isFailed() ? contacts.getValue() : [],
        recipient: recipient.getValue(),
        permission: invite.permission,
      })
    }

    return Result.ok()
  }

  private async performSendKeyChangeMessage(params: Params): Promise<Result<void>> {
    const result = await this._sendKeyChangedMessage.execute({
      keySystemIdentifier: params.sharedVault.systemIdentifier,
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (result.isFailed()) {
      return result
    }

    return Result.ok()
  }

  private async deleteAllInvites(sharedVaultUuid: string): Promise<Result<void>> {
    const response = await this._inviteServer.deleteAllSharedVaultInvites({
      sharedVaultUuid: sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to delete existing invites ${JSON.stringify(response)}`)
    }

    return Result.ok()
  }

  private async getExistingInvites(sharedVaultUuid: string): Promise<Result<SharedVaultInviteServerHash[]>> {
    const response = await this._inviteServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return Result.fail(`Failed to get outbound user invites ${JSON.stringify(response)}`)
    }

    const invites = response.data.invites

    return Result.ok(invites.filter((invite) => invite.shared_vault_uuid === sharedVaultUuid))
  }
}
