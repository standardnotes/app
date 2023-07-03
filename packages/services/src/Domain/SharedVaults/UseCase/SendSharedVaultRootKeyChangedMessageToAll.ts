import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultRootKeyChanged,
  KeySystemIdentifier,
  TrustedContactInterface,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash, ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { GetSharedVaultUsersUseCase } from './GetSharedVaultUsers'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'

export class SendSharedVaultRootKeyChangedMessageToAll {
  constructor(
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private vaultUsersServer: SharedVaultUsersServerInterface,
    private messageServer: AsymmetricMessageServerInterface,
  ) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    senderUuid: string
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<ClientDisplayableError[]> {
    const errors: ClientDisplayableError[] = []

    const getUsersUseCase = new GetSharedVaultUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ sharedVaultUuid: params.sharedVaultUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot send root key changed message; users not found')]
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
        keySystemIdentifier: params.keySystemIdentifier,
        sharedVaultUuid: params.sharedVaultUuid,
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
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    contact: TrustedContactInterface
  }): Promise<AsymmetricMessageServerHash | ClientDisplayableError> {
    const keySystemRootKey = this.encryption.keys.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.keySystemIdentifier}`)
    }

    const message: AsymmetricMessageSharedVaultRootKeyChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      data: { recipientUuid: params.contact.contactUuid, rootKey: keySystemRootKey.content },
    }

    const encryptedMessage = this.encryption.asymmetricallyEncryptMessage({
      message: message,
      senderKeyPair: params.senderKeyPair,
      senderSigningKeyPair: params.senderSigningKeyPair,
      recipientPublicKey: params.contact.publicKeySet.encryption,
    })

    const replaceabilityIdentifier = [
      AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      params.sharedVaultUuid,
      params.keySystemIdentifier,
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
