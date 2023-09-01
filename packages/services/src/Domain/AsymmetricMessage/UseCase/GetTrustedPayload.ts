import { AsymmetricMessageServerHash, SharedVaultInviteServerHash } from '@standardnotes/responses'
import { AsymmetricMessagePayload, TrustedContactInterface } from '@standardnotes/models'
import { DecryptMessage } from '../../Encryption/UseCase/Asymmetric/DecryptMessage'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetTrustedPayload implements SyncUseCaseInterface<AsymmetricMessagePayload> {
  constructor(private decryptMessage: DecryptMessage) {}

  execute<M extends AsymmetricMessagePayload>(dto: {
    privateKey: string
    payload: AsymmetricMessageServerHash | SharedVaultInviteServerHash
    sender: TrustedContactInterface
    ownUserUuid: string
  }): Result<M> {
    const result = this.decryptMessage.execute<M>({
      message: dto.payload.encrypted_message,
      sender: dto.sender,
      privateKey: dto.privateKey,
    })

    if (result.isFailed()) {
      return result
    }

    const recipientUuid = result.getValue().data.recipientUuid

    if (recipientUuid !== dto.ownUserUuid) {
      return Result.fail('Message is not for this user')
    }

    return result
  }
}
