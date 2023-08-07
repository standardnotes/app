import { UserServiceInterface } from './../../User/UserServiceInterface'
import { IsVaultOwner } from './../../VaultUser/UseCase/IsVaultOwner'
import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultMetadataChanged,
  SharedVaultListingInterface,
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
import { GetKeyPairs } from '../../Encryption/UseCase/GetKeyPairs'

export class SendVaultDataChangedMessage implements UseCaseInterface<void> {
  constructor(
    private users: UserServiceInterface,
    private _encryptMessage: EncryptMessage,
    private _findContact: FindContact,
    private _getVaultUsers: GetVaultUsers,
    private _sendMessage: SendMessage,
    private _isVaultOwner: IsVaultOwner,
    private _getKeyPairs: GetKeyPairs,
  ) {}

  async execute(params: { vault: SharedVaultListingInterface }): Promise<Result<void>> {
    const isOwner = this._isVaultOwner.execute(params.vault).getValue()
    if (!isOwner) {
      return Result.ok()
    }

    const users = await this._getVaultUsers.execute({
      sharedVaultUuid: params.vault.sharing.sharedVaultUuid,
      readFromCache: false,
    })
    if (users.isFailed()) {
      return Result.fail('Cannot send metadata changed message; users not found')
    }

    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail('Cannot send metadata changed message; keys not found')
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

      const sendMessageResult = await this.sendToContact({
        vault: params.vault,
        keys: keys.getValue(),
        contact: trustedContact.getValue(),
      })

      if (sendMessageResult.isFailed()) {
        errors.push(sendMessageResult.getError())
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }

  private async sendToContact(params: {
    vault: SharedVaultListingInterface
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    contact: TrustedContactInterface
  }): Promise<Result<AsymmetricMessageServerHash>> {
    const message: AsymmetricMessageSharedVaultMetadataChanged = {
      type: AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
      data: {
        recipientUuid: params.contact.contactUuid,
        sharedVaultUuid: params.vault.sharing.sharedVaultUuid,
        name: params.vault.name,
        description: params.vault.description,
      },
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
      AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
      params.vault.sharing.sharedVaultUuid,
      params.vault.systemIdentifier,
    )

    const sendMessageResult = await this._sendMessage.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
