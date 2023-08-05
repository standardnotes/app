import { UserServiceInterface } from './../../User/UserServiceInterface'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultRootKeyChanged,
  KeySystemIdentifier,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { GetVaultUsers } from '../../VaultUser/UseCase/GetVaultUsers'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetReplaceabilityIdentifier } from '../../AsymmetricMessage/UseCase/GetReplaceabilityIdentifier'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'
import { GetKeyPairs } from '../../Encryption/UseCase/GetKeyPairs'

export class SendVaultKeyChangedMessage implements UseCaseInterface<void> {
  constructor(
    private users: UserServiceInterface,
    private keyManager: KeySystemKeyManagerInterface,
    private _encryptMessage: EncryptMessage,
    private _findContact: FindContact,
    private _sendMessage: SendMessage,
    private _getVaultUsers: GetVaultUsers,
    private _getKeyPairs: GetKeyPairs,
  ) {}

  async execute(params: { keySystemIdentifier: KeySystemIdentifier; sharedVaultUuid: string }): Promise<Result<void>> {
    const users = await this._getVaultUsers.execute({ sharedVaultUuid: params.sharedVaultUuid, readFromCache: false })
    if (users.isFailed()) {
      return Result.fail('Cannot send root key changed message; users not found')
    }

    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail('Cannot send root key changed message; keys not found')
    }

    const errors: string[] = []

    for (const user of users.getValue()) {
      if (user.user_uuid === this.users.sureUser.uuid) {
        continue
      }

      const trustedContact = this._findContact.execute({ userUuid: user.user_uuid })
      if (trustedContact.isFailed()) {
        continue
      }

      const result = await this.sendToContact({
        keySystemIdentifier: params.keySystemIdentifier,
        sharedVaultUuid: params.sharedVaultUuid,
        keys: keys.getValue(),
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

    const encryptedMessage = this._encryptMessage.execute({
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

    const sendMessageResult = await this._sendMessage.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
