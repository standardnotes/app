import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { HashStringUseCase } from '../Hash/HashString'

export class GenerateSymmetricPlaintextSigningDataUseCase {
  private hashUseCase = new HashStringUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payloadPlaintext: string,
    signingKeyPair: PkcKeyPair | undefined,
  ): { signingPayload: SymmetricItemSigningPayload; plaintextHash: string } {
    const plaintextHash = this.hashUseCase.execute(payloadPlaintext)

    if (!signingKeyPair) {
      return {
        signingPayload: {},
        plaintextHash,
      }
    }

    return {
      signingPayload: {
        data: {
          publicKey: signingKeyPair.publicKey,
          signature: this.crypto.sodiumCryptoSign(plaintextHash, signingKeyPair.privateKey),
        },
      },
      plaintextHash,
    }
  }
}
