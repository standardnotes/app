import {
  AsymmetricMessagePayload,
  AsymmetricMessagePayloadType,
  KeySystemIdentifier,
  KeySystemRootKeyContentSpecialized,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { UpdateSharedVaultInviteUseCase } from './UpdateSharedVaultInvite'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class UpdateInvitesAfterSharedVaultDataChangeUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    senderUuid: string
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError[]> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.keySystemIdentifier}`)
    }

    const errors: ClientDisplayableError[] = []

    const reuploadErrors = await this.reuploadExistingInvites({
      sharedVaultUuid: params.sharedVaultUuid,
      keySystemRootKeyData: keySystemRootKey.content,
      senderUuid: params.senderUuid,
      senderEncryptionKeyPair: params.senderEncryptionKeyPair,
      senderSigningKeyPair: params.senderSigningKeyPair,
    })
    errors.push(...reuploadErrors)

    return errors
  }

  private async reuploadExistingInvites(params: {
    sharedVaultUuid: string
    keySystemRootKeyData: KeySystemRootKeyContentSpecialized
    senderUuid: string
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError[]> {
    const response = await this.vaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return [ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)]
    }

    const invites = response.data.invites

    const existingSharedVaultInvites = invites.filter((invite) => invite.shared_vault_uuid === params.sharedVaultUuid)

    const errors: ClientDisplayableError[] = []

    for (const invite of existingSharedVaultInvites) {
      const encryptedMessage = this.encryptVaultMessageForRecipient({
        message: { type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged, data: params.keySystemRootKeyData },
        inviterPrivateKey: params.senderEncryptionKeyPair.privateKey,
        senderSigningKeyPair: params.senderSigningKeyPair,
        recipientUuid: invite.user_uuid,
      })

      if (!encryptedMessage) {
        errors.push(
          ClientDisplayableError.FromString(`Failed to encrypt key system root key for user ${invite.user_uuid}`),
        )
        continue
      }

      const updateInviteUseCase = new UpdateSharedVaultInviteUseCase(this.vaultInvitesServer)
      const updateInviteResult = await updateInviteUseCase.execute({
        sharedVaultUuid: params.sharedVaultUuid,
        inviteUuid: invite.uuid,
        senderPublicKey: params.senderEncryptionKeyPair.publicKey,
        encryptedMessage,
        permissions: invite.permissions,
      })

      if (isClientDisplayableError(updateInviteResult)) {
        errors.push(updateInviteResult)
      }
    }

    return errors
  }

  private encryptVaultMessageForRecipient(params: {
    message: AsymmetricMessagePayload
    inviterPrivateKey: string
    senderSigningKeyPair: PkcKeyPair
    recipientUuid: string
  }): string | undefined {
    const trustedContact = this.contacts.findTrustedContact(params.recipientUuid)
    if (!trustedContact) {
      return
    }

    return this.encryption.asymmetricallyEncryptMessage({
      message: params.message,
      senderPrivateKey: params.inviterPrivateKey,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: trustedContact.publicKey.encryption,
    })
  }
}
