import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { OperatorManager } from '@standardnotes/encryption'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class EncryptAsymmetricMessagePayload implements SyncUseCaseInterface<string> {
  constructor(private operators: OperatorManager) {}

  execute(dto: {
    message: AsymmetricMessagePayload
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: string
  }): Result<string> {
    const operator = this.operators.defaultOperator()

    const encrypted = operator.asymmetricEncrypt({
      stringToEncrypt: JSON.stringify(dto.message),
      senderKeyPair: dto.senderKeyPair,
      senderSigningKeyPair: dto.senderSigningKeyPair,
      recipientPublicKey: dto.recipientPublicKey,
    })

    return Result.ok(encrypted)
  }
}
