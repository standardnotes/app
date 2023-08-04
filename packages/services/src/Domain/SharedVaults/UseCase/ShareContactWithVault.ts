import { UserServiceInterface } from './../../User/UserServiceInterface'
import {
  TrustedContactInterface,
  SharedVaultListingInterface,
  AsymmetricMessagePayloadType,
} from '@standardnotes/models'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { GetVaultUsers } from '../../VaultUser/UseCase/GetVaultUsers'
import { GetKeyPairs } from '../../Encryption/UseCase/GetKeyPairs'

export class ShareContactWithVault implements UseCaseInterface<void> {
  constructor(
    private users: UserServiceInterface,
    private _findContact: FindContact,
    private _encryptMessage: EncryptMessage,
    private _sendMessage: SendMessage,
    private _getVaultUsers: GetVaultUsers,
    private _getKeyPairs: GetKeyPairs,
  ) {}

  async execute(params: {
    sharedVault: SharedVaultListingInterface
    contactToShare: TrustedContactInterface
  }): Promise<Result<void>> {
    if (params.sharedVault.sharing.ownerUserUuid !== this.users.sureUser.uuid) {
      return Result.fail('Cannot share contact; user is not the owner of the shared vault')
    }

    const users = await this._getVaultUsers.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      readFromCache: false,
    })

    if (users.isFailed()) {
      return Result.fail('Cannot share contact; shared vault users not found')
    }

    if (users.getValue().length === 0) {
      return Result.ok()
    }

    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail('Cannot share contact; keys not found')
    }

    for (const vaultUser of users.getValue()) {
      if (vaultUser.user_uuid === this.users.sureUser.uuid) {
        continue
      }

      if (vaultUser.user_uuid === params.contactToShare.contactUuid) {
        continue
      }

      const vaultUserAsContact = this._findContact.execute({ userUuid: vaultUser.user_uuid })
      if (vaultUserAsContact.isFailed()) {
        continue
      }

      const encryptedMessage = this._encryptMessage.execute({
        message: {
          type: AsymmetricMessagePayloadType.ContactShare,
          data: {
            recipientUuid: vaultUserAsContact.getValue().contactUuid,
            trustedContact: params.contactToShare.content,
          },
        },
        keys: keys.getValue(),
        recipientPublicKey: vaultUserAsContact.getValue().publicKeySet.encryption,
      })

      if (encryptedMessage.isFailed()) {
        continue
      }

      await this._sendMessage.execute({
        recipientUuid: vaultUserAsContact.getValue().contactUuid,
        encryptedMessage: encryptedMessage.getValue(),
        replaceabilityIdentifier: undefined,
      })
    }

    return Result.ok()
  }
}
