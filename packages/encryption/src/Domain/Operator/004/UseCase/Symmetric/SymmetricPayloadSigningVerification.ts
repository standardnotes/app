import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Components } from '../../V004AlgorithmTypes'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { DecryptedParameters, EncryptedParameters } from '../../../../Types/EncryptedParameters'

export class SymmetricPayloadSigningVerificationUseCase {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    encrypted: EncryptedParameters,
    contentKeyComponents: V004Components,
    contentComponents: V004Components,
  ): DecryptedParameters['signature'] {
    const contentKeySigningPayload = this.parseBase64Usecase.execute<SymmetricItemSigningPayload>(
      contentKeyComponents.signingData,
    )

    const contentSigningPayload = this.parseBase64Usecase.execute<SymmetricItemSigningPayload>(
      contentComponents.signingData,
    )

    const verificationRequired = doesPayloadRequireSigning(encrypted)

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

    const contentKeySignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentKeyComponents.ciphertext,
      contentKeySigningPayload.data.signature,
      contentKeySigningPayload.data.publicKey,
    )

    const contentSignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentComponents.ciphertext,
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
