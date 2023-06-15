import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { TrustedContactInterface, SharedVaultDisplayListing, AsymmetricMessagePayloadType } from '@standardnotes/models'
import { AsymmetricMessageServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'

export class ShareContactWithAllMembersOfSharedVaultUseCase {
  constructor(
    private contacts: ContactServiceInterface,
    private encryption: EncryptionProviderInterface,
    private sharedVaultUsersServer: SharedVaultUsersServerInterface,
    private messageServer: AsymmetricMessageServerInterface,
  ) {}

  async execute(params: {
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    senderUserUuid: string
    sharedVault: SharedVaultDisplayListing
    contactToShare: TrustedContactInterface
  }): Promise<void | ClientDisplayableError> {
    if (params.sharedVault.ownerUserUuid !== params.senderUserUuid) {
      return ClientDisplayableError.FromString('Cannot share contact; user is not the owner of the shared vault')
    }

    const usersResponse = await this.sharedVaultUsersServer.getSharedVaultUsers({
      sharedVaultUuid: params.sharedVault.sharedVaultUuid,
    })

    if (isErrorResponse(usersResponse)) {
      return ClientDisplayableError.FromString('Cannot share contact; shared vault users not found')
    }

    const users = usersResponse.data.users
    if (users.length === 0) {
      return
    }

    const messageSendUseCase = new SendAsymmetricMessageUseCase(this.messageServer)

    for (const vaultUser of users) {
      if (vaultUser.user_uuid === params.senderUserUuid) {
        continue
      }

      if (vaultUser.user_uuid === params.contactToShare.contactUuid) {
        continue
      }

      const vaultUserAsContact = this.contacts.findTrustedContact(vaultUser.user_uuid)
      if (!vaultUserAsContact) {
        continue
      }

      const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
        message: {
          type: AsymmetricMessagePayloadType.ContactShare,
          data: params.contactToShare.content,
        },
        senderKeyPair: params.senderKeyPair,
        senderSigningKeyPair: params.senderSigningKeyPair,
        recipientPublicKey: vaultUserAsContact.publicKeySet.encryption,
      })

      await messageSendUseCase.execute({
        recipientUuid: vaultUserAsContact.contactUuid,
        encryptedMessage,
        replaceabilityIdentifier: undefined,
      })
    }
  }
}
