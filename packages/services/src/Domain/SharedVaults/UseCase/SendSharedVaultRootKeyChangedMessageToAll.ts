import { SendSharedVaultRootKeyChangeMessage } from './../../AsymmetricMessage/UseCase/SendSharedVaultRootKeyChangeMessage'
import { KeySystemIdentifier } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isClientDisplayableError } from '@standardnotes/responses'
import { AsymmetricMessageServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { GetSharedVaultUsersUseCase } from './GetSharedVaultUsers'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class SendSharedVaultRootKeyChangedMessageToAll {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultUsersServer: SharedVaultUsersServerInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
    private messageServer: AsymmetricMessageServerInterface,
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

    const getUsersUseCase = new GetSharedVaultUsersUseCase(this.vaultUsersServer)
    const users = await getUsersUseCase.execute({ sharedVaultUuid: params.sharedVaultUuid })
    if (!users) {
      return [ClientDisplayableError.FromString('Cannot rotate key system root key; users not found')]
    }

    if (users.length === 0) {
      return []
    }

    const sendMessageUseCase = new SendSharedVaultRootKeyChangeMessage(this.encryption, this.items, this.messageServer)

    for (const user of users) {
      if (user.user_uuid === params.senderUuid) {
        continue
      }

      const trustedContact = this.contacts.findTrustedContact(user.user_uuid)
      if (!trustedContact) {
        continue
      }

      const sendMessageResult = await sendMessageUseCase.execute({
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
}
