import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload, TrustedContactInterface } from '@standardnotes/models'
import { DecryptMessage } from '../../Encryption/UseCase/Asymmetric/DecryptMessage'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetTrustedPayload<M extends AsymmetricMessagePayload> implements SyncUseCaseInterface<M> {
  constructor(private operators: OperatorManager) {}

  execute(dto: {
    privateKey: string
    message: AsymmetricMessageServerHash
    contact: TrustedContactInterface
  }): Result<M> {
    const usecase = new DecryptMessage<M>(this.operators)

    const result = usecase.execute({
      message: dto.message.encrypted_message,
      sender: dto.contact,
      privateKey: dto.privateKey,
    })

    return result
  }
}
