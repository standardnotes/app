import { Base64String, HexString, PkcKeyPair, PureCryptoInterface, Utf8String } from '@standardnotes/sncrypto-common'
import { PkcV1Algorithm } from '../../PkcAlgorithm'

export type PkcV1Ciphertext = Base64String
export type PkcV1PrivateKeyCiphertext = Base64String

const VersionString = 'PkcV1'
const SymmetricCiphertextPrefix = `${VersionString}_Sym`
const AsymmetricCiphertextPrefix = `${VersionString}_Asym`

export class PkcOperatorV1 {
  protected readonly crypto: PureCryptoInterface

  constructor(crypto: PureCryptoInterface) {
    this.crypto = crypto
  }

  generateKeyPair(): PkcKeyPair {
    return this.crypto.sodiumCryptoBoxGenerateKeypair()
  }

  encryptText(text: Utf8String, senderSecretKey: HexString, recipientPublicKey: HexString): PkcV1Ciphertext {
    const nonce = this.crypto.generateRandomKey(PkcV1Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(text, nonce, senderSecretKey, recipientPublicKey)

    return [AsymmetricCiphertextPrefix, nonce, ciphertext].join(':')
  }

  decryptText(ciphertext: PkcV1Ciphertext, senderPublicKey: HexString, recipientSecretKey: HexString): Utf8String {
    const components = ciphertext.split(':')

    const nonce = components[1]

    return this.crypto.sodiumCryptoBoxEasyDecrypt(ciphertext, nonce, senderPublicKey, recipientSecretKey)
  }

  encryptPrivateKey(privateKey: HexString, symmetricKey: HexString): PkcV1PrivateKeyCiphertext {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const nonce = this.crypto.generateRandomKey(PkcV1Algorithm.SymmetricEncryptionNonceLength)

    const encryptedKey = this.crypto.xchacha20Encrypt(privateKey, nonce, symmetricKey)

    return [SymmetricCiphertextPrefix, nonce, encryptedKey].join(':')
  }

  decryptPrivateKey(encryptedPrivateKey: PkcV1PrivateKeyCiphertext, symmetricKey: HexString): HexString | null {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const components = encryptedPrivateKey.split(':')

    const nonce = components[1]

    return this.crypto.xchacha20Decrypt(encryptedPrivateKey, nonce, symmetricKey)
  }
}
