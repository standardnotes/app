import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { doesPayloadRequireSigning } from '../../V004AlgorithmHelpers'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
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

    const commonPublicKey = contentKeySigningPayload.data.publicKey

    const contentKeySignatureVerified = this.verifySignature(
      contentKeyParameters.plaintext,
      contentKeySigningPayload.data.signature,
      commonPublicKey,
      payloadEncryptionKey,
    )

    const contentSignatureVerified = this.verifySignature(
      contentParameters.plaintext,
      contentSigningPayload.data.signature,
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
