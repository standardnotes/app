import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultDisplayListing } from '../../Vaults/VaultDisplayListing'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others.
 */
export class HandleSuccessfullyChangedCredentials {
  constructor(
    private sharedVaultInvitesServer: SharedVaultInvitesServerInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(dto: {
    eventData: SuccessfullyChangedCredentialsEventData
    sharedVaults: SharedVaultDisplayListing[]
  }): Promise<ClientDisplayableError[]> {
    await this.contacts.refreshAllContactsAfterPublicKeyChange()
    await this.sharedVaultInvitesServer.deleteAllInboundInvites()

    const errors = await this.updateAllOutboundInvites({
      newPublicKey: dto.eventData.newPublicKey,
      newPrivateKey: dto.eventData.newPrivateKey,
      sharedVaults: dto.sharedVaults,
    })
    return errors
  }

  private async updateAllOutboundInvites(params: {
    newPublicKey: string
    newPrivateKey: string
    sharedVaults: SharedVaultDisplayListing[]
  }): Promise<ClientDisplayableError[]> {
    const getOutboundInvitesResponse = await this.sharedVaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(getOutboundInvitesResponse)) {
      return [ClientDisplayableError.FromString('Failed to get outbound user invites for current user')]
    }

    const errors: ClientDisplayableError[] = []

    const outboundInvites = getOutboundInvitesResponse.data.invites
    for (const invite of outboundInvites) {
      const sharedVault = params.sharedVaults.find(
        (sharedVault) => sharedVault.sharedVaultUuid === invite.shared_vault_uuid,
      )
      if (!sharedVault) {
        errors.push(ClientDisplayableError.FromString('Failed to find sharedVault for invite'))
        continue
      }

      const error = await this.updateInvite({
        sharedVault,
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

  private async updateInvite(params: {
    invite: SharedVaultInviteServerHash
    sharedVault: SharedVaultDisplayListing
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError | undefined> {
    const isEncryptedWithNewPublicKey = params.invite.inviter_public_key === params.newPublicKey
    if (isEncryptedWithNewPublicKey) {
      return undefined
    }

    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Failed to find key system root key for invite')
    }

    const trustedContact = this.contacts.findTrustedContact(params.invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const newEncryptedVaultData = this.encryption.encryptKeySystemRootKeyContentWithRecipientPublicKey(
      keySystemRootKey.content,
      params.newPrivateKey,
      trustedContact.publicKey,
    )

    const updateInviteResponse = await this.sharedVaultInvitesServer.updateInvite({
      sharedVaultUuid: params.invite.shared_vault_uuid,
      inviteUuid: params.invite.uuid,
      inviterPublicKey: params.newPublicKey,
      encryptedKeySystemRootKeyContent: newEncryptedVaultData,
    })

    if (isErrorResponse(updateInviteResponse)) {
      return ClientDisplayableError.FromString('Failed to update invite')
    }

    return undefined
  }
}
