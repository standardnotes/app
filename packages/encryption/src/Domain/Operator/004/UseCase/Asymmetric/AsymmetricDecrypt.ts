import { HexString, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricSigningPayload } from '../../../../Types/EncryptionSigningData'

export class AsymmetricDecryptUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    senderPublicKey: HexString
    recipientSecretKey: HexString
  }): { plaintext: HexString; signatureVerified: boolean; signaturePublicKey: string } | null {
    const [_, nonce, ciphertext, signingDataString] = <V004AsymmetricStringComponents>dto.stringToDecrypt.split(':')

    try {
      const plaintext = this.crypto.sodiumCryptoBoxEasyDecrypt(
        ciphertext,
        nonce,
        dto.senderPublicKey,
        dto.recipientSecretKey,
      )

      const parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

      const signingData = parseBase64Usecase.execute<AsymmetricSigningPayload>(signingDataString)

      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        signingData.data.signature,
        signingData.data.publicKey,
      )

      return {
        plaintext,
        signatureVerified,
        signaturePublicKey: signingData.data.publicKey,
      }
    } catch (error) {
      return null
    }
  }
}
