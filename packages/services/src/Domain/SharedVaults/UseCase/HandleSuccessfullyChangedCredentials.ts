import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, SharedVaultInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultDisplayListing, AsymmetricMessagePayloadType } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others. It must also delete any
 * invites, as they are encrypted with the old key and will become no longer valid.
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
    await this.sharedVaultInvitesServer.deleteAllInboundInvites()

    const errors = await this.updateAllOutboundInvites({
      sharedVaults: dto.sharedVaults,
      newKeyPair: dto.eventData.newKeyPair,
      newSigningKeyPair: dto.eventData.newSigningKeyPair,
    })
    return errors
  }

  private async updateAllOutboundInvites(params: {
    newKeyPair: PkcKeyPair
    newSigningKeyPair: PkcKeyPair
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

      const error = await this.updateOutboundInvite({
        sharedVault,
        invite,
        newKeyPair: params.newKeyPair,
        newSigningKeyPair: params.newSigningKeyPair,
      })

      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  private async updateOutboundInvite(params: {
    invite: SharedVaultInviteServerHash
    sharedVault: SharedVaultDisplayListing
    newKeyPair: PkcKeyPair
    newSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError | undefined> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Failed to find key system root key for invite')
    }

    const trustedContact = this.contacts.findTrustedContact(params.invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const newEncryptedVaultData = this.encryption.asymmetricallyEncryptMessage({
      message: { type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged, data: keySystemRootKey.content },
      senderKeyPair: params.newKeyPair,
      senderSigningKeyPair: params.newSigningKeyPair,
      recipientPublicKey: trustedContact.publicKey.encryption,
    })

    const updateInviteResponse = await this.sharedVaultInvitesServer.updateInvite({
      sharedVaultUuid: params.invite.shared_vault_uuid,
      inviteUuid: params.invite.uuid,
      encryptedMessage: newEncryptedVaultData,
    })

    if (isErrorResponse(updateInviteResponse)) {
      return ClientDisplayableError.FromString('Failed to update invite')
    }

    return undefined
  }
}
