import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SymmetricItemSigningPayload } from '../../../../Types/EncryptionSigningData'
import { HashStringUseCase } from '../Hash/HashString'

export class GenerateSymmetricPlaintextSigningDataUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(
    payloadPlaintext: string,
    signingKeyPair: PkcKeyPair | undefined,
  ): { signingPayload: SymmetricItemSigningPayload; plaintextHash: string } {
    const hashUseCase = new HashStringUseCase(this.crypto)
    const plaintextHash = hashUseCase.execute(payloadPlaintext)

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
