import { HexString, PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { AsymmetricallyEncryptedString } from '../../../Types'
import { V004Algorithm } from '../../../../Algorithm'
import { V004AsymmetricCiphertextPrefix, V004AsymmetricStringComponents } from '../../V004AlgorithmTypes'
import { CreateConsistentBase64JsonPayloadUseCase } from '../Utils/CreateConsistentBase64JsonPayload'

export class AsymmetricEncryptUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(dto: {
    stringToEncrypt: HexString
    senderSecretKey: HexString
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: HexString
  }): AsymmetricallyEncryptedString {
    const nonce = this.crypto.generateRandomKey(V004Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(
      dto.stringToEncrypt,
      nonce,
      dto.senderSecretKey,
      dto.recipientPublicKey,
    )

    const base64DataUsecase = new CreateConsistentBase64JsonPayloadUseCase(this.crypto)

    const signingDataString = base64DataUsecase.execute({
      embeddedValue: {
        publicKey: dto.senderSigningKeyPair.publicKey,
        signature: this.crypto.sodiumCryptoSign(ciphertext, dto.senderSigningKeyPair.privateKey),
      },
    })

    const components: V004AsymmetricStringComponents = [
      V004AsymmetricCiphertextPrefix,
      nonce,
      ciphertext,
      signingDataString,
    ]

    return components.join(':')
  }
}
