import { AsymmetricMessageServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { DecryptMessage } from '../../Encryption/UseCase/Asymmetric/DecryptMessage'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetUntrustedPayload implements SyncUseCaseInterface<AsymmetricMessagePayload> {
  constructor(private decryptMessage: DecryptMessage) {}

  execute<M extends AsymmetricMessagePayload>(dto: {
    privateKey: string
    message: AsymmetricMessageServerHash
  }): Result<M> {
    const result = this.decryptMessage.execute<M>({
      message: dto.message.encrypted_message,
      sender: undefined,
      privateKey: dto.privateKey,
    })

    return result
  }
}
