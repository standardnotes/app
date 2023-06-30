import { EncryptedInputParameters } from '../../../../Types/EncryptedParameters'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { HashStringUseCase } from '../Hash/HashString'
import { PersistentSignatureData } from '@standardnotes/models'
import { HashingKey } from '../Hash/HashingKey'

/**
 * Embedded signatures check the signature on the symmetric string, but this string can change every time we encrypt
 * the payload, even though its content hasn't changed. This would mean that if we received a signed payload from User B,
 * then saved this payload into local storage by encrypting it, we would lose the signature of the content it came with, and
 * it would instead be overwritten by our local user signature, which would always pass.
 *
 * In addition to embedded signature verification, we'll also hang on to a sticky signature of the content, which
 * remains the same until the hash changes. We do not perform any static verification on this data; instead, clients
 * can compute authenticity of the content on demand.
 */
export class GenerateSymmetricPayloadSignatureResultUseCase {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)
  private hashUseCase = new HashStringUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payload: EncryptedInputParameters,
    hashingKey: HashingKey,
    contentKeyParameters: {
      additionalData: string
      plaintext: string
    },
    contentParameters: {
      additionalData: string
      plaintext: string
    },
  ): PersistentSignatureData {
    const contentKeyHash = this.hashUseCase.execute(contentKeyParameters.plaintext, hashingKey)

    const contentHash = this.hashUseCase.execute(contentParameters.plaintext, hashingKey)

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
          contentHash: contentHash,
          result: {
            passes: false,
            publicKey: '',
            signature: '',
          },
        }
      }
      return {
        required: false,
        contentHash: contentHash,
      }
    }

    if (contentKeyAdditionalData.signingData.publicKey !== contentAdditionalData.signingData.publicKey) {
      return {
        required: verificationRequired,
        contentHash: contentHash,
        result: {
          passes: false,
          publicKey: '',
          signature: '',
        },
      }
    }

    const commonPublicKey = contentKeyAdditionalData.signingData.publicKey

    const contentKeySignatureVerified = this.verifySignature(
      contentKeyHash,
      contentKeyAdditionalData.signingData.signature,
      commonPublicKey,
    )

    const contentSignatureVerified = this.verifySignature(
      contentHash,
      contentAdditionalData.signingData.signature,
      commonPublicKey,
    )

    let passesStickyContentVerification = true
    const previousSignatureResult = payload.signatureData
    if (previousSignatureResult) {
      const previousSignatureStillApplicable = previousSignatureResult.contentHash === contentHash

      if (previousSignatureStillApplicable) {
        if (previousSignatureResult.required) {
          passesStickyContentVerification = previousSignatureResult.result.passes
        } else if (previousSignatureResult.result) {
          passesStickyContentVerification = previousSignatureResult.result.passes
        }
      }
    }

    const passesAllVerification =
      contentKeySignatureVerified && contentSignatureVerified && passesStickyContentVerification

    return {
      required: verificationRequired,
      contentHash: contentHash,
      result: {
        passes: passesAllVerification,
        publicKey: commonPublicKey,
        signature: contentAdditionalData.signingData.signature,
      },
    }
  }

  private verifySignature(contentHash: string, signature: string, publicKey: string) {
    return this.crypto.sodiumCryptoSignVerify(contentHash, signature, publicKey)
  }
}
