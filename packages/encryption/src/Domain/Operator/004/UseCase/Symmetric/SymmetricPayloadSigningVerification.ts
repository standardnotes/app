import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { V004Components } from '../../V004AlgorithmTypes'
import { doesPayloadRequireSigning } from "../../V004AlgorithmHelpers"
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { DecryptedParameters, EncryptedParameters } from '../../../../Types/EncryptedParameters'

export class SymmetricPayloadSigningVerificationUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    encrypted: EncryptedParameters,
    contentKeyComponents: V004Components,
    contentComponents: V004Components,
  ): DecryptedParameters['signature'] {
    const parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)
    const contentKeySigningPayload = parseBase64Usecase.execute<SymmetricItemSigningPayload>(
      contentKeyComponents.signingData,
    )

    const contentSigningPayload = parseBase64Usecase.execute<SymmetricItemSigningPayload>(contentComponents.signingData)

    const verificationRequired = doesPayloadRequireSigning(encrypted)

    if (!contentKeySigningPayload.embeddedValue || !contentSigningPayload.embeddedValue) {
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

    if (contentKeySigningPayload.embeddedValue.publicKey !== contentSigningPayload.embeddedValue.publicKey) {
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
      contentKeySigningPayload.embeddedValue.signature,
      contentKeySigningPayload.embeddedValue.publicKey,
    )

    const contentSignatureVerified = this.crypto.sodiumCryptoSignVerify(
      contentComponents.ciphertext,
      contentSigningPayload.embeddedValue.signature,
      contentSigningPayload.embeddedValue.publicKey,
    )

    return {
      required: verificationRequired,
      result: {
        passes: contentKeySignatureVerified && contentSignatureVerified,
        publicKey: contentKeySigningPayload.embeddedValue.publicKey,
      },
    }
  }
}
