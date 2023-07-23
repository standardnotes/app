import { SyncUseCaseInterface, Result } from '@standardnotes/domain-core'
import { EncryptionOperatorsInterface } from '@standardnotes/encryption'
import { AsymmetricMessagePayload } from '@standardnotes/models'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'

export class EncryptMessage implements SyncUseCaseInterface<string> {
  constructor(private operators: EncryptionOperatorsInterface) {}

  execute(dto: {
    message: AsymmetricMessagePayload
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    recipientPublicKey: string
  }): Result<string> {
    const operator = this.operators.defaultOperator()

    const encrypted = operator.asymmetricEncrypt({
      stringToEncrypt: JSON.stringify(dto.message),
      senderKeyPair: dto.keys.encryption,
      senderSigningKeyPair: dto.keys.signing,
      recipientPublicKey: dto.recipientPublicKey,
    })

    return Result.ok(encrypted)
  }
}
