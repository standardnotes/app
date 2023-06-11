import { HexString, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'

export class AsymmetricDecryptUseCase {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    stringToDecrypt: AsymmetricallyEncryptedString
    senderPublicKey: HexString
    recipientSecretKey: HexString
  }): { plaintext: HexString; signatureVerified: boolean; signaturePublicKey: string } | null {
    const [_, nonce, ciphertext, additionalDataString] = <V004AsymmetricStringComponents>dto.stringToDecrypt.split(':')

    try {
      const plaintext = this.crypto.sodiumCryptoBoxEasyDecrypt(
        ciphertext,
        nonce,
        dto.senderPublicKey,
        dto.recipientSecretKey,
      )

      const additionalData = this.parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)

      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        additionalData.signingData.signature,
        additionalData.signingData.publicKey,
      )

      return {
        plaintext,
        signatureVerified,
        signaturePublicKey: additionalData.signingData.publicKey,
      }
    } catch (error) {
      return null
    }
  }
}
