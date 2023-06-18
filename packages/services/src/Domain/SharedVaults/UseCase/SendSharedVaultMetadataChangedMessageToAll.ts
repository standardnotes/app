import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultMetadataChanged,
  SharedVaultListingInterface,
  TrustedContactInterface,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash, ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { GetSharedVaultUsersUseCase } from './GetSharedVaultUsers'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'

export class SendSharedVaultMetadataChangedMessageToAll {
  constructor(
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private vaultUsersServer: SharedVaultUsersServerInterface,
    private messageServer: AsymmetricMessageServerInterface,
  ) {}

  async execute(params: {
    vault: SharedVaultListingInterface
    senderUuid: string
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError[]> {
    const errors: ClientDisplayableError[] = []

    const getUsersUseCase = new GetSharedVaultUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ sharedVaultUuid: params.vault.sharing.sharedVaultUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot send metadata changed message; users not found')]
    }

    for (const user of users) {
      if (user.user_uuid === params.senderUuid) {
        continue
      }

      const trustedContact = this.contacts.findTrustedContact(user.user_uuid)
      if (!trustedContact) {
        continue
      }

      const sendMessageResult = await this.sendToContact({
        vault: params.vault,
        senderKeyPair: params.senderEncryptionKeyPair,
        senderSigningKeyPair: params.senderSigningKeyPair,
        contact: trustedContact,
      })

      if (isClientDisplayableError(sendMessageResult)) {
        errors.push(sendMessageResult)
      }
    }

    return errors
  }

  private async sendToContact(params: {
    vault: SharedVaultListingInterface
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    contact: TrustedContactInterface
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const message: AsymmetricMessageSharedVaultMetadataChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
      data: {
        recipientUuid: params.contact.contactUuid,
        name: params.vault.name,
        description: params.vault.description,
      },
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: message,
      senderKeyPair: params.senderKeyPair,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: params.contact.publicKeySet.encryption,
    })

    const replaceabilityIdentifier = [
      AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
      params.vault.sharing.sharedVaultUuid,
      params.vault.systemIdentifier,
    ].join(':')

    const sendMessageUseCase = new SendAsymmetricMessageUseCase(this.messageServer)
    const sendMessageResult = await sendMessageUseCase.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage,
      replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
