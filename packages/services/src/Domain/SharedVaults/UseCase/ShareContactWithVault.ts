import { isErrorResponse } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  SharedVaultListingInterface,
  AsymmetricMessagePayloadType,
} from '@standardnotes/models'
import { AsymmetricMessageServerInterface, SharedVaultUsersServerInterface } from '@standardnotes/api'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ShareContactWithVault implements UseCaseInterface<void> {
  constructor(
    private contacts: ContactServiceInterface,
    private encryptMessage: EncryptMessage,
    private userServer: SharedVaultUsersServerInterface,
    private messageServer: AsymmetricMessageServerInterface,
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

    const usersResponse = await this.userServer.getSharedVaultUsers({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
    })

    if (isErrorResponse(usersResponse)) {
      return Result.fail('Cannot share contact; shared vault users not found')
    }

    const users = usersResponse.data.users
    if (users.length === 0) {
      return Result.ok()
    }

    const messageSendUseCase = new SendMessage(this.messageServer)

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

      const encryptedMessage = this.encryptMessage.execute({
        message: {
          type: AsymmetricMessagePayloadType.ContactShare,
          data: { recipientUuid: vaultUserAsContact.contactUuid, trustedContact: params.contactToShare.content },
        },
        keys: params.keys,
        recipientPublicKey: vaultUserAsContact.publicKeySet.encryption,
      })

      if (encryptedMessage.isFailed()) {
        continue
      }

      await messageSendUseCase.execute({
        recipientUuid: vaultUserAsContact.contactUuid,
        encryptedMessage: encryptedMessage.getValue(),
        replaceabilityIdentifier: undefined,
      })
    }

    return Result.ok()
  }
}
