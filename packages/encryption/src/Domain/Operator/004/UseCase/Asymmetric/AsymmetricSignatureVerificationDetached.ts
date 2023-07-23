import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types/Types'
import { V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { ParseConsistentBase64JsonPayloadUseCase } from '../Utils/ParseConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'
import { AsymmetricSignatureVerificationDetachedResult } from '../../../Types/AsymmetricSignatureVerificationDetachedResult'

export class AsymmetricSignatureVerificationDetached004 {
  private parseBase64Usecase = new ParseConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: { encryptedString: AsymmetricallyEncryptedString }): AsymmetricSignatureVerificationDetachedResult {
    const [_, __, ciphertext, additionalDataString] = <V004AsymmetricStringComponents>dto.encryptedString.split(':')

    const additionalData = this.parseBase64Usecase.execute<AsymmetricItemAdditionalData>(additionalDataString)

    try {
      const signatureVerified = this.crypto.sodiumCryptoSignVerify(
        ciphertext,
        additionalData.signingData.signature,
        additionalData.signingData.publicKey,
      )

      return {
        signatureVerified,
        signaturePublicKey: additionalData.signingData.publicKey,
        senderPublicKey: additionalData.senderPublicKey,
      }
    } catch (error) {
      return {
        signatureVerified: false,
      }
    }
  }
}
