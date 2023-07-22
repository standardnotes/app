import {
  AsymmetricMessagePayloadType,
  AsymmetricMessageSharedVaultMetadataChanged,
  SharedVaultListingInterface,
  TrustedContactInterface,
} from '@standardnotes/models'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { GetSharedVaultUsers } from './GetSharedVaultUsers'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { SendMessage } from '../../AsymmetricMessage/UseCase/SendMessage'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { GetReplaceabilityIdentifier } from '../../AsymmetricMessage/UseCase/GetReplaceabilityIdentifier'
import { FindContact } from '../../Contacts/UseCase/FindContact'

export class SendVaultDataChangedMessage implements UseCaseInterface<void> {
  constructor(
    private encryptMessage: EncryptMessage,
    private findContact: FindContact,
    private getVaultUsers: GetSharedVaultUsers,
    private sendMessage: SendMessage,
  ) {}

  async execute(params: {
    vault: SharedVaultListingInterface
    senderUuid: string
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
  }): Promise<Result<void>> {
    const users = await this.getVaultUsers.execute({ sharedVaultUuid: params.vault.sharing.sharedVaultUuid })
    if (!users) {
      return Result.fail('Cannot send metadata changed message; users not found')
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

      const sendMessageResult = await this.sendToContact({
        vault: params.vault,
        keys: params.keys,
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

    const encryptedMessage = this.encryptMessage.execute({
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

    const sendMessageResult = await this.sendMessage.execute({
      recipientUuid: params.contact.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      replaceabilityIdentifier,
    })

    return sendMessageResult
  }
}
