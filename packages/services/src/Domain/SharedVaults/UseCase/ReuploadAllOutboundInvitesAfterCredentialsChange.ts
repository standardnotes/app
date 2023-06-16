import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { SharedVaultInvitesServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'
import { SharedVaultListingInterface, TrustedContactInterface } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { InviteContactToSharedVaultUseCase } from './InviteContactToSharedVault'
import { GetSharedVaultTrustedContacts } from './GetSharedVaultTrustedContacts'
import { GetVaultUseCase } from '../../Vaults/UseCase/GetVault'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others. It must also delete any
 * invites, as they are encrypted with the old key and will become no longer valid.
 */
export class ReuploadAllOutboundInvitesAfterCredentialsChange {
  private vaultContactsCache: Record<string, TrustedContactInterface[]> = {}

  constructor(
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
    private sharedVaultInvitesServer: SharedVaultInvitesServerInterface,
    private sharedVaultUsersServer: SharedVaultUsersServerInterface,
  ) {}

  async execute(dto: { eventData: SuccessfullyChangedCredentialsEventData }): Promise<ClientDisplayableError[]> {
    const outboundInvites = await this.getAllOutboundInvites()
    if (isClientDisplayableError(outboundInvites)) {
      return [outboundInvites]
    }

    if (!dto.eventData.oldSigningKeyPair) {
      return [ClientDisplayableError.FromString('Old signing key pair is required')]
    }

    const errors = []

    for (const invite of outboundInvites) {
      const result = await this.resendInvite({
        invite,
        newKeyPair: dto.eventData.newKeyPair,
        newSigningKeyPair: dto.eventData.newSigningKeyPair,
        oldSigningKeyPair: dto.eventData.oldSigningKeyPair,
      })

      if (isClientDisplayableError(result)) {
        errors.push(result)
      }
    }

    return errors
  }

  private async resendInvite(params: {
    invite: SharedVaultInviteServerHash
    newKeyPair: PkcKeyPair
    newSigningKeyPair: PkcKeyPair
    oldSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError | void> {
    const signatureResult = this.encryption.asymmetricSignatureVerifyDetached(params.invite.encrypted_message)
    if (!signatureResult.signatureVerified) {
      return ClientDisplayableError.FromString('Failed to verify signature of previous invite')
    }

    if (signatureResult.senderPublicKey !== params.oldSigningKeyPair.publicKey) {
      return ClientDisplayableError.FromString('Sender public key does not match signature')
    }

    const trustedContact = this.contacts.findTrustedContact(params.invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const sharedVault = this.getVaultListingForInvite(params.invite)
    if (!sharedVault) {
      return ClientDisplayableError.FromString('Failed to find shared vault for invite')
    }

    const vaultContacts = await this.getVaultContacts(sharedVault)
    const usecase = new InviteContactToSharedVaultUseCase(this.encryption, this.sharedVaultInvitesServer)
    const result = await usecase.execute({
      senderKeyPair: params.newKeyPair,
      senderSigningKeyPair: params.newSigningKeyPair,
      sharedVault: sharedVault,
      sharedVaultContacts: vaultContacts,
      recipient: trustedContact,
      permissions: params.invite.permissions,
    })

    if (isClientDisplayableError(result)) {
      return result
    }
  }

  private async getAllOutboundInvites(): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError> {
    const getOutboundInvitesResponse = await this.sharedVaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(getOutboundInvitesResponse)) {
      return ClientDisplayableError.FromString('Failed to get outbound user invites for current user')
    }

    return getOutboundInvitesResponse.data.invites
  }

  private async getVaultContacts(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]> {
    if (this.vaultContactsCache[sharedVault.uuid]) {
      return this.vaultContactsCache[sharedVault.uuid]
    }

    const usecase = new GetSharedVaultTrustedContacts(this.contacts, this.sharedVaultUsersServer)
    const contacts = await usecase.execute(sharedVault)
    if (!contacts) {
      return []
    }

    this.vaultContactsCache[sharedVault.uuid] = contacts

    return contacts
  }

  private getVaultListingForInvite(invite: SharedVaultInviteServerHash): SharedVaultListingInterface | undefined {
    const usecase = new GetVaultUseCase<SharedVaultListingInterface>(this.items)
    return usecase.execute({ sharedVaultUuid: invite.shared_vault_uuid })
  }
}
