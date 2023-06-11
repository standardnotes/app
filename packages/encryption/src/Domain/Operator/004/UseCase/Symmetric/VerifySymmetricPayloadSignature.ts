import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { DecryptedParameters } from '../../../../Types/EncryptedParameters'
import { HashStringUseCase } from '../Hash/HashString'

export class VerifySymmetricPayloadSignatureUseCase {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)
  private hashUseCase = new HashStringUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: { key_system_identifier?: string; shared_vault_uuid?: string },
    payloadEncryptionKey: string,
    contentKeyParameters: {
      additionalData: string
      plaintext: string
    },
    contentParameters: {
      additionalData: string
      plaintext: string
    },
  ): DecryptedParameters['signature'] {
    const contentKeyAdditionalData = this.parseBase64Usecase.execute<SymmetricItemAdditionalData>(
      contentKeyParameters.additionalData,
    )

    const contentAdditionalData = this.parseBase64Usecase.execute<SymmetricItemAdditionalData>(
      contentParameters.additionalData,
    )

    const verificationRequired = doesPayloadRequireSigning(payload)

    if (!contentKeyAdditionalData.signingData || !contentAdditionalData.signingData) {
      if (verificationRequired) {
        return {
          required: true,
          result: {
            passes: false,
            publicKey: '',
          },
        }
      }
      return {
        required: false,
      }
    }

    if (contentKeyAdditionalData.signingData.publicKey !== contentAdditionalData.signingData.publicKey) {
      return {
        required: verificationRequired,
        result: {
          passes: false,
          publicKey: '',
        },
      }
    }

    const commonPublicKey = contentKeyAdditionalData.signingData.publicKey

    const contentKeySignatureVerified = this.verifySignature(
      contentKeyParameters.plaintext,
      contentKeyAdditionalData.signingData.signature,
      commonPublicKey,
      payloadEncryptionKey,
    )

    const contentSignatureVerified = this.verifySignature(
      contentParameters.plaintext,
      contentAdditionalData.signingData.signature,
      commonPublicKey,
      payloadEncryptionKey,
    )

    return {
      required: verificationRequired,
      result: {
        passes: contentKeySignatureVerified && contentSignatureVerified,
        publicKey: commonPublicKey,
      },
    }
  }

  private verifySignature(plaintext: string, signature: string, publicKey: string, payloadEncryptionKey: string) {
    const hash = this.hashUseCase.execute(plaintext, payloadEncryptionKey)

    return this.crypto.sodiumCryptoSignVerify(hash, signature, publicKey)
  }
}
