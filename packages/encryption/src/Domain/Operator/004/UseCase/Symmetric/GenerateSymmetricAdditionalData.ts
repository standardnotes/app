import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { HashStringUseCase } from '../Hash/HashString'

export class GenerateSymmetricAdditionalDataUseCase {
  private hashUseCase = new HashStringUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payloadPlaintext: string,
    payloadEncryptionKey: string,
    signingKeyPair?: PkcKeyPair,
  ): { additionalData: AdditionalData; plaintextHash: string } {
    const plaintextHash = this.hashUseCase.execute(payloadPlaintext, payloadEncryptionKey)

    if (!signingKeyPair) {
      return {
        additionalData: {},
        plaintextHash,
      }
    }

    const signature = this.crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey)

    return {
      additionalData: {
        signingData: {
          publicKey: signingKeyPair.publicKey,
          signature,
        },
      },
      plaintextHash,
    }
  }
}
