import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  SharedVaultInviteType,
  SharedVaultPermission,
} from '@standardnotes/responses'
import { TrustedContactInterface, SharedVaultDisplayListing, SharedVaultMessageType } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { CreateSharedVaultInviteUseCase } from './CreateSharedVaultInvite'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class InviteContactToSharedVaultUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private sharedVaultInviteServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    inviterKeyPair: PkcKeyPair
    inviterSigningKeyPair: PkcKeyPair
    sharedVault: SharedVaultDisplayListing
    contact: TrustedContactInterface
    permissions: SharedVaultPermission
  }): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.items.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return ClientDisplayableError.FromString('Cannot add contact; key system root key not found')
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptSharedVaultMessage({
      message: { type: SharedVaultMessageType.RootKey, data: keySystemRootKey.content },
      senderPrivateKey: params.inviterKeyPair.privateKey,
      senderSigningKeyPair: params.inviterSigningKeyPair,
      recipientPublicKey: params.contact.publicKey.encryption,
    })

    const createInviteUseCase = new CreateSharedVaultInviteUseCase(this.sharedVaultInviteServer)
    const createInviteResult = await createInviteUseCase.execute({
      sharedVaultUuid: params.sharedVault.sharedVaultUuid,
      inviteeUuid: params.contact.contactUuid,
      inviterPublicKey: params.inviterKeyPair.publicKey,
      encryptedMessage,
      inviteType: SharedVaultInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
