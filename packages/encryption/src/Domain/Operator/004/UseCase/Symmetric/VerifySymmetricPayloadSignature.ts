import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { DecryptedParameters, EncryptedParameters } from '../../../../Types/EncryptedParameters'
import { HashStringUseCase } from '../Hash/HashString'

export class VerifySymmetricPayloadSignatureUseCase {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)
  private hashUseCase = new HashStringUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: EncryptedParameters,
    payloadEncryptionKey: string,
    contentKeyParameters: {
      signingData: string
      plaintext: string
    },
    contentParameters: {
      signingData: string
      plaintext: string
    },
  ): DecryptedParameters['signature'] {
    const contentKeySigningPayload = this.parseBase64Usecase.execute<SymmetricItemSigningPayload>(
      contentKeyParameters.signingData,
    )

    const contentSigningPayload = this.parseBase64Usecase.execute<SymmetricItemSigningPayload>(
      contentParameters.signingData,
    )

    const verificationRequired = doesPayloadRequireSigning(payload)

    if (!contentKeySigningPayload.data || !contentSigningPayload.data) {
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

    if (contentKeySigningPayload.data.publicKey !== contentSigningPayload.data.publicKey) {
      return {
        required: verificationRequired,
        result: {
          passes: false,
          publicKey: '',
        },
      }
    }

    const contentKeyHash = this.hashUseCase.execute(contentKeyParameters.plaintext, payloadEncryptionKey)
    const contentKeySignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentKeyHash,
      contentKeySigningPayload.data.signature,
      contentKeySigningPayload.data.publicKey,
    )

    const contentHash = this.hashUseCase.execute(contentParameters.plaintext, payloadEncryptionKey)
    const contentSignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentHash,
      contentSigningPayload.data.signature,
      contentSigningPayload.data.publicKey,
    )

    return {
      required: verificationRequired,
      result: {
        passes: contentKeySignatureVerified && contentSignatureVerified,
        publicKey: contentKeySigningPayload.data.publicKey,
      },
    }
  }
}
