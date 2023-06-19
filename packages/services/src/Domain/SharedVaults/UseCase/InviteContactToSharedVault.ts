import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, SharedVaultInviteServerHash, SharedVaultPermission } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  SharedVaultListingInterface,
  AsymmetricMessagePayloadType,
} from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SendSharedVaultInviteUseCase } from './SendSharedVaultInviteUseCase'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class InviteContactToSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private sharedVaultInviteServer: SharedVaultInvitesServerInterface,
  ) {}

  async execute(params: {
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    sharedVault: SharedVaultListingInterface
    sharedVaultContacts: TrustedContactInterface[]
    recipient: TrustedContactInterface
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.encryption.keys.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Cannot add contact; key system root key not found')
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: {
        type: AsymmetricMessagePayloadType.SharedVaultInvite,
        data: {
          recipientUuid: params.recipient.contactUuid,
          rootKey: keySystemRootKey.content,
          trustedContacts: params.sharedVaultContacts.map((contact) => contact.content),
          metadata: {
            name: params.sharedVault.name,
            description: params.sharedVault.description,
          },
        },
      },
      senderKeyPair: params.senderKeyPair,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    const createInviteUseCase = new SendSharedVaultInviteUseCase(this.sharedVaultInviteServer)
    const createInviteResult = await createInviteUseCase.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
