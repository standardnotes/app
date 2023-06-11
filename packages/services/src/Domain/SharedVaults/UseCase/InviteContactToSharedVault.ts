import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, SharedVaultInviteServerHash, SharedVaultPermission } from '@standardnotes/responses'
import { TrustedContactInterface, SharedVaultDisplayListing, AsymmetricMessagePayloadType } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SendSharedVaultInviteUseCase } from './SendSharedVaultInviteUseCase'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class InviteContactToSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private sharedVaultInviteServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    sharedVault: SharedVaultDisplayListing
    sharedVaultContacts: TrustedContactInterface[]
    recipient: TrustedContactInterface
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Cannot add contact; key system root key not found')
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: {
        type: AsymmetricMessagePayloadType.SharedVaultInvite,
        data: {
          rootKey: keySystemRootKey.content,
          trustedContacts: params.sharedVaultContacts.map((contact) => contact.content),
        },
      },
      senderKeyPair: params.senderKeyPair,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: params.recipient.publicKey.encryption,
    })

    const createInviteUseCase = new SendSharedVaultInviteUseCase(this.sharedVaultInviteServer)
    const createInviteResult = await createInviteUseCase.execute({
      sharedVaultUuid: params.sharedVault.sharedVaultUuid,
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
