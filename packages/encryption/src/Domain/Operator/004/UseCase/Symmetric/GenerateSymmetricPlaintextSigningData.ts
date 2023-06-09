import { ClientSignaturePayload } from '@standardnotes/models'
import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { HashStringUseCase } from '../Hash/HashString'

export class GenerateSymmetricPlaintextSigningDataUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payloadPlaintext: string,
    existingSignaturePayload: ClientSignaturePayload | undefined,
    signingKeyPair: PkcKeyPair | undefined,
  ): { signingData: SymmetricItemSigningPayload; plaintextHash: string } {
    const hashUseCase = new HashStringUseCase(this.crypto)
    const plaintextHash = hashUseCase.execute(payloadPlaintext)

    if (existingSignaturePayload) {
      const needsNewSignature = plaintextHash !== existingSignaturePayload.plaintextHash
      if (!needsNewSignature) {
        return {
          signingData: {
            embeddedValue: {
              publicKey: existingSignaturePayload.signerPublicKey,
              signature: existingSignaturePayload.signature,
            },
          },
          plaintextHash,
        }
      }
    }

    if (!signingKeyPair) {
      return {
        signingData: {},
        plaintextHash,
      }
    }

    return {
      signingData: {
        embeddedValue: {
          publicKey: signingKeyPair.publicKey,
          signature: this.crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey),
        },
      },
      plaintextHash,
    }
  }
}
