import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { DecryptMessage } from '../../Encryption/UseCase/Asymmetric/DecryptMessage'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetUntrustedPayload<M extends AsymmetricMessagePayload> implements SyncUseCaseInterface<M> {
  constructor(private operators: OperatorManager) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): Result<M> {
    const usecase = new DecryptMessage<M>(this.operators)

    const result = usecase.execute({
      message: dto.message.encrypted_message,
      sender: undefined,
      privateKey: dto.privateKey,
    })

    return result
  }
}
