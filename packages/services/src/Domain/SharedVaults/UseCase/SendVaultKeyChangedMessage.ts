import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultRootKeyChanged,
  KeySystemIdentifier,
  TrustedContactInterface,
} from '@standardnotes/models'
import { KeySystemKeyManagerInterface } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { GetVaultUsers } from './GetVaultUsers'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetReplaceabilityIdentifier } from '../../AsymmetricMessage/UseCase/GetReplaceabilityIdentifier'
import { FindContact } from '../../Contacts/UseCase/FindContact'

export class SendVaultKeyChangedMessage implements UseCaseInterface<void> {
  constructor(
    private encryptMessage: EncryptMessage,
    private keyManager: KeySystemKeyManagerInterface,
    private findContact: FindContact,
    private sendMessage: SendMessage,
    private getVaultUsers: GetVaultUsers,
  ) {}

  async execute(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    senderUuid: string
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
  }): Promise<Result<void>> {
    const users = await this.getVaultUsers.execute({ sharedVaultUuid: params.sharedVaultUuid })
    if (!users) {
      return Result.fail('Cannot send root key changed message; users not found')
    }

    const errors: string[] = []

    for (const user of users) {
      if (user.user_uuid === params.senderUuid) {
        continue
      }

      const trustedContact = this.findContact.execute({ userUuid: user.user_uuid })
      if (trustedContact.isFailed()) {
        continue
      }

      const result = await this.sendToContact({
        keySystemIdentifier: params.keySystemIdentifier,
        sharedVaultUuid: params.sharedVaultUuid,
        keys: params.keys,
        contact: trustedContact.getValue(),
      })

      if (result.isFailed()) {
        errors.push(result.getError())
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }

  private async sendToContact(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    contact: TrustedContactInterface
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const keySystemRootKey = this.keyManager.getPrimaryKeySystemRootKey(params.keySystemIdentifier)
    if (!keySystemRootKey) {
      throw new Error(`Vault key not found for keySystemIdentifier ${params.keySystemIdentifier}`)
    }

    const message: AsymmetricMessageSharedVaultRootKeyChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      data: { recipientUuid: params.contact.contactUuid, rootKey: keySystemRootKey.content },
    }

    const encryptedMessage = this.encryptMessage.execute({
      message: message,
      keys: params.keys,
      recipientPublicKey: params.contact.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const replaceabilityIdentifier = GetReplaceabilityIdentifier(
      AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
      params.sharedVaultUuid,
      params.keySystemIdentifier,
    )

    const sendMessageResult = await this.sendMessage.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
