import { VaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, VaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others.
 */
export class HandleSuccessfullyChangedCredentials {
  constructor(
    private vaultInvitesServer: VaultInvitesServerInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(data: SuccessfullyChangedCredentialsEventData): Promise<ClientDisplayableError[]> {
    await this.contacts.refreshAllContactsAfterPublicKeyChange()

    await this.vaultInvitesServer.deleteAllInboundInvites()

    const errors = await this.updateAllInvites(data)

    return errors
  }

  private async updateAllInvites(params: {
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError[]> {
    const getOutboundInvitesResponse = await this.vaultInvitesServer.getOutboundUserInvites()
    if (isErrorResponse(getOutboundInvitesResponse)) {
      return [ClientDisplayableError.FromString('Failed to get outbound user invites for current user')]
    }

    const errors: ClientDisplayableError[] = []

    const outboundInvites = getOutboundInvitesResponse.data.invites
    for (const invite of outboundInvites) {
      const error = await this.updateInvite({
        invite,
        newPublicKey: params.newPublicKey,
        newPrivateKey: params.newPrivateKey,
      })

      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  private async updateInvite({
    invite,
    newPublicKey,
    newPrivateKey,
  }: {
    invite: VaultInviteServerHash
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError | undefined> {
    const isEncryptedWithNewPublicKey = invite.inviter_public_key === newPublicKey
    if (isEncryptedWithNewPublicKey) {
      return undefined
    }

    const vaultKey = this.encryption.getVaultKey(invite.vault_uuid)
    if (!vaultKey) {
      return ClientDisplayableError.FromString('Failed to find vault key for invite')
    }

    const trustedContact = this.contacts.findTrustedContact(invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const newEncryptedVaultData = this.encryption.encryptVaultDataWithRecipientPublicKey(
      vaultKey.content,
      newPrivateKey,
      trustedContact.publicKey,
    )

    const updateInviteResponse = await this.vaultInvitesServer.updateInvite({
      vaultUuid: invite.vault_uuid,
      inviteUuid: invite.uuid,
      inviterPublicKey: newPublicKey,
      encryptedVaultData: newEncryptedVaultData,
    })

    if (isErrorResponse(updateInviteResponse)) {
      return ClientDisplayableError.FromString('Failed to update invite')
    }

    return undefined
  }
}
