import {
  AsymmetricMessagePayloadType,
  TrustedContactInterface,
  TrustedContactMutator,
  AsymmetricMessageSenderKeysetRevoked,
  PortablePublicKeySet,
} from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { ContactServiceInterface } from '../ContactServiceInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { EncryptAsymmetricMessagePayload } from '../../Encryption/UseCase/Asymmetric/EncryptAsymmetricMessagePayload'
import { SendAsymmetricMessageUseCase } from '../../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'

export class RevokePublicKeyUseCase implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private contacts: ContactServiceInterface,
    private encryptAsymmetricMessageUseCase: EncryptAsymmetricMessagePayload,
    private sendMessageUseCase: SendAsymmetricMessageUseCase,
  ) {}

  async execute(dto: {
    selfContact: TrustedContactInterface
    revokeKeySet: PortablePublicKeySet
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<Result<void>> {
    const currentKeySet = dto.selfContact.publicKeySet

    if (
      currentKeySet.encryption === dto.revokeKeySet.encryption ||
      currentKeySet.signing === dto.revokeKeySet.signing
    ) {
      return Result.fail('Cannot revoke current key set')
    }

    await this.mutator.changeItem<TrustedContactMutator>(dto.selfContact, (mutator) => {
      mutator.revokePublicKeySet({
        encryption: dto.revokeKeySet.encryption,
        signing: dto.revokeKeySet.signing,
      })
    })

    await this.sendMessageToContacts(dto)

    return Result.ok()
  }

  private async sendMessageToContacts(dto: {
    revokeKeySet: PortablePublicKeySet
    senderEncryptionKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
  }): Promise<void> {
    const allContacts = this.contacts.getAllContacts().filter((contact) => !contact.isMe)

    for (const contact of allContacts) {
      const message: AsymmetricMessageSenderKeysetRevoked = {
        type: AsymmetricMessagePayloadType.SenderKeysetRevoked,
        data: {
          recipientUuid: contact.contactUuid,
          revokedPublicKey: dto.revokeKeySet.encryption,
          revokedSigningPublicKey: dto.revokeKeySet.signing,
        },
      }

      const encryptedMessage = this.encryptAsymmetricMessageUseCase.execute({
        message: message,
        senderKeyPair: dto.senderEncryptionKeyPair,
        senderSigningKeyPair: dto.senderSigningKeyPair,
        recipientPublicKey: contact.publicKeySet.encryption,
      })

      if (encryptedMessage.isFailed()) {
        continue
      }

      await this.sendMessageUseCase.execute({
        recipientUuid: contact.contactUuid,
        encryptedMessage: encryptedMessage.getValue(),
        replaceabilityIdentifier: undefined,
      })
    }
  }
}
