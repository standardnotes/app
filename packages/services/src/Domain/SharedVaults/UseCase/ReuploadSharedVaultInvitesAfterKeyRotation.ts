import {
  KeySystemRootKeyContentSpecialized,
  SharedVaultListingInterface,
  TrustedContactInterface,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { InviteContactToSharedVaultUseCase } from './InviteContactToSharedVault'
import { GetSharedVaultTrustedContacts } from './GetSharedVaultTrustedContacts'

type ReuploadAllSharedVaultInvitesDTO = {
  sharedVault: SharedVaultListingInterface
  senderUuid: string
  senderEncryptionKeyPair: PkcKeyPair
  senderSigningKeyPair: PkcKeyPair
}

export class ReuploadSharedVaultInvitesAfterKeyRotationUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private vaultUserServer: SharedVaultUsersServerInterface,
  ) {}

  async execute(params: ReuploadAllSharedVaultInvitesDTO): Promise<ClientDisplayableError[]> {
    const keySystemRootKey = this.encryption.keySystemKeyManager.getPrimaryKeySystemRootKey(
      params.sharedVault.systemIdentifier,
    )
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.sharedVault.systemIdentifier}`)
    }

    const existingInvites = await this.getExistingInvites(params.sharedVault.sharing.sharedVaultUuid)
    if (isClientDisplayableError(existingInvites)) {
      return [existingInvites]
    }

    const deleteResult = await this.deleteExistingInvites(params.sharedVault.sharing.sharedVaultUuid)
    if (isClientDisplayableError(deleteResult)) {
      return [deleteResult]
    }

    const vaultContacts = await this.getVaultContacts(params.sharedVault)
    if (vaultContacts.length === 0) {
      return []
    }

    const errors: ClientDisplayableError[] = []

    for (const invite of existingInvites) {
      const contact = this.contacts.findTrustedContact(invite.user_uuid)
      if (!contact) {
        errors.push(ClientDisplayableError.FromString(`Contact not found for invite ${invite.user_uuid}`))
        continue
      }

      const result = await this.sendNewInvite({
        usecaseDTO: params,
        contact: contact,
        previousInvite: invite,
        keySystemRootKeyData: keySystemRootKey.content,
        sharedVaultContacts: vaultContacts,
      })

      if (isClientDisplayableError(result)) {
        errors.push(result)
      }
    }

    return errors
  }

  private async getVaultContacts(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]> {
    const usecase = new GetSharedVaultTrustedContacts(this.contacts, this.vaultUserServer)
    const contacts = await usecase.execute(sharedVault)
    if (!contacts) {
      return []
    }

    return contacts
  }

  private async getExistingInvites(
    sharedVaultUuid: string,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    const invites = response.data.invites

    return invites.filter((invite) => invite.shared_vault_uuid === sharedVaultUuid)
  }

  private async deleteExistingInvites(sharedVaultUuid: string): Promise<ClientDisplayableError | void> {
    const response = await this.vaultInvitesServer.deleteAllSharedVaultInvites({
      sharedVaultUuid: sharedVaultUuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete existing invites ${response}`)
    }
  }

  private async sendNewInvite(params: {
    usecaseDTO: ReuploadAllSharedVaultInvitesDTO
    contact: TrustedContactInterface
    previousInvite: SharedVaultInviteServerHash
    keySystemRootKeyData: KeySystemRootKeyContentSpecialized
    sharedVaultContacts: TrustedContactInterface[]
  }): Promise<ClientDisplayableError | void> {
    const signatureResult = this.encryption.asymmetricSignatureVerifyDetached(params.previousInvite.encrypted_message)
    if (!signatureResult.signatureVerified) {
      return ClientDisplayableError.FromString('Failed to verify signature of previous invite')
    }

    if (signatureResult.senderPublicKey !== params.usecaseDTO.senderSigningKeyPair.publicKey) {
      return ClientDisplayableError.FromString('Sender public key does not match signature')
    }

    const usecase = new InviteContactToSharedVaultUseCase(this.encryption, this.vaultInvitesServer)
    const result = await usecase.execute({
      senderKeyPair: params.usecaseDTO.senderEncryptionKeyPair,
      senderSigningKeyPair: params.usecaseDTO.senderSigningKeyPair,
      sharedVault: params.usecaseDTO.sharedVault,
      sharedVaultContacts: params.sharedVaultContacts,
      recipient: params.contact,
      permissions: params.previousInvite.permissions,
    })

    if (isClientDisplayableError(result)) {
      return result
    }
  }
}
