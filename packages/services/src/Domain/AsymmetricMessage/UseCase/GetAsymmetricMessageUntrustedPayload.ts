import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { DecryptAsymmetricMessagePayload } from '../../Encryption/UseCase/Asymmetric/DecryptAsymmetricMessagePayload'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetAsymmetricMessageUntrustedPayload<M extends AsymmetricMessagePayload>
  implements SyncUseCaseInterface<M>
{
  constructor(private operators: OperatorManager) {}

  execute(dto: { privateKey: string; message: AsymmetricMessageServerHash }): Result<M> {
    const usecase = new DecryptAsymmetricMessagePayload<M>(this.operators)

    const result = usecase.execute({
      encryptedString: dto.message.encrypted_message,
      trustedSender: undefined,
      privateKey: dto.privateKey,
    })

    return result
  }
}
