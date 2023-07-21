import { OperatorManager } from '@standardnotes/encryption'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { DecryptAsymmetricMessagePayload } from '../../Encryption/UseCase/Asymmetric/DecryptAsymmetricMessagePayload'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetAsymmetricMessageTrustedPayload<M extends AsymmetricMessagePayload> implements SyncUseCaseInterface<M> {
  constructor(private operators: OperatorManager, private contacts: ContactServiceInterface) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): Result<M> {
    const trustedContact = this.contacts.findTrustedContact(dto.message.sender_uuid)
    if (!trustedContact) {
      return Result.fail('Trusted contact not found')
    }

    const usecase = new DecryptAsymmetricMessagePayload<M>(this.operators)

    const result = usecase.execute({
      encryptedString: dto.message.encrypted_message,
      trustedSender: trustedContact,
      privateKey: dto.privateKey,
    })

    return result
  }
}
