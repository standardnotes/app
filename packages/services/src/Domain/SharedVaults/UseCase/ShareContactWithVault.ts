import {
  TrustedContactInterface,
  SharedVaultListingInterface,
  AsymmetricMessagePayloadType,
} from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { FindContact } from '../../Contacts/UseCase/FindContact'
import { GetVaultUsers } from './GetVaultUsers'

export class ShareContactWithVault implements UseCaseInterface<void> {
  constructor(
    private findContact: FindContact,
    private encryptMessage: EncryptMessage,
    private sendMessage: SendMessage,
    private getVaultUsers: GetVaultUsers,
  ) {}

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    senderUserUuid: string
    sharedVault: SharedVaultListingInterface
    contactToShare: TrustedContactInterface
  }): Promise<Result<void>> {
    if (params.sharedVault.sharing.ownerUserUuid !== params.senderUserUuid) {
      return Result.fail('Cannot share contact; user is not the owner of the shared vault')
    }

    const users = await this.getVaultUsers.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (!users) {
      return Result.fail('Cannot share contact; shared vault users not found')
    }

    if (users.length === 0) {
      return Result.ok()
    }

    for (const vaultUser of users) {
      if (vaultUser.user_uuid === params.senderUserUuid) {
        continue
      }

      if (vaultUser.user_uuid === params.contactToShare.contactUuid) {
        continue
      }

      const vaultUserAsContact = this.findContact.execute({ userUuid: vaultUser.user_uuid })
      if (vaultUserAsContact.isFailed()) {
        continue
      }

      const encryptedMessage = this.encryptMessage.execute({
        message: {
          type: AsymmetricMessagePayloadType.ContactShare,
          data: {
            recipientUuid: vaultUserAsContact.getValue().contactUuid,
            trustedContact: params.contactToShare.content,
          },
        },
        keys: params.keys,
        recipientPublicKey: vaultUserAsContact.getValue().publicKeySet.encryption,
      })

      if (encryptedMessage.isFailed()) {
        continue
      }

      await this.sendMessage.execute({
        recipientUuid: vaultUserAsContact.getValue().contactUuid,
        encryptedMessage: encryptedMessage.getValue(),
        replaceabilityIdentifier: undefined,
      })
    }

    return Result.ok()
  }
}
