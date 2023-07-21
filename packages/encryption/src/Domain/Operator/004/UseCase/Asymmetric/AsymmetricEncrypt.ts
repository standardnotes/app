import { HexString, PkcKeyPair, PureCryptoInterface, Utf8String } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types/Types'
import { V004Algorithm } from '../../../../Algorithm'
import { V004AsymmetricCiphertextPrefix, V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'
import { AsymmetricItemAdditionalData } from '../../../../Types/EncryptionAdditionalData'

export class AsymmetricEncrypt004 {
  private base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    stringToEncrypt: Utf8String
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString {
    const nonce = this.crypto.generateRandomKey(V004Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(
      dto.stringToEncrypt,
      nonce,
      dto.recipientPublicKey,
      dto.senderKeyPair.privateKey,
    )

    const additionalData: AsymmetricItemAdditionalData = {
      signingData: {
        publicKey: dto.senderSigningKeyPair.publicKey,
        signature: this.crypto.sodiumCryptoSign(ciphertext, dto.senderSigningKeyPair.privateKey),
      },
      senderPublicKey: dto.senderKeyPair.publicKey,
    }

    const components: V004AsymmetricStringComponents = [
      V004AsymmetricCiphertextPrefix,
      nonce,
      ciphertext,
      this.base64DataUsecase.execute(additionalData),
    ]

    return components.join(':')
  }
}
