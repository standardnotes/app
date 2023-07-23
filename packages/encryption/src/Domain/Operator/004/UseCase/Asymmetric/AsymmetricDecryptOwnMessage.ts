import { HexString, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types/Types'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { AsymmetricDecryptResult } from '../../../Types/AsymmetricDecryptResult'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class AsymmetricDecryptOwnMessage004 implements SyncUseCaseInterface<AsymmetricDecryptResult> {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    message: AsymmetricallyEncryptedString
    ownPrivateKey: HexString
    recipientPublicKey: HexString
  }): Result<AsymmetricDecryptResult> {
    const [_, nonce, ciphertext, additionalDataString] = <V004AsymmetricStringComponents>dto.message.split(':')

    const additionalData = this.parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)

    try {
      const plaintext = this.crypto.sodiumCryptoBoxEasyDecrypt(
        ciphertext,
        nonce,
        dto.recipientPublicKey,
        dto.ownPrivateKey,
      )

      if (!plaintext) {
        return Result.fail('Could not decrypt message')
      }

      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        additionalData.signingData.signature,
        additionalData.signingData.publicKey,
      )

      return Result.ok({
        plaintext,
        signatureVerified,
        signaturePublicKey: additionalData.signingData.publicKey,
        senderPublicKey: additionalData.senderPublicKey,
      })
    } catch (error) {
      return Result.fail('Could not decrypt message')
    }
  }
}
