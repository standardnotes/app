import { ProtocolVersion } from '@standardnotes/common'
import { Base64String, HexString, PkcKeyPair, Utf8String } from '@standardnotes/sncrypto-common'
import { V005Algorithm } from '../../Algorithm'
import { SNProtocolOperator004 } from '../004/Operator004'

const VersionString = '005'
const SymmetricCiphertextPrefix = `${VersionString}_KeySym`
const AsymmetricCiphertextPrefix = `${VersionString}_KeyAsym`

export type AsymmetricallyEncryptedKey = Base64String
export type SymmetricallyEncryptedPrivateKey = Base64String

export class ProtocolOperator005 extends SNProtocolOperator004 {
  public override getEncryptionDisplayName(): string {
    return 'XChaCha20-Poly1305'
  }

  override get version(): ProtocolVersion {
    return VersionString as ProtocolVersion
  }

  generateKeyPair(): PkcKeyPair {
    return this.crypto.sodiumCryptoBoxGenerateKeypair()
  }

  asymmetricEncryptKey(
    keyToEncrypt: HexString,
    senderSecretKey: HexString,
    recipientPublicKey: HexString,
  ): AsymmetricallyEncryptedKey {
    const nonce = this.crypto.generateRandomKey(V005Algorithm.AsymmetricEncryptionNonceLength)

    const ciphertext = this.crypto.sodiumCryptoBoxEasyEncrypt(keyToEncrypt, nonce, senderSecretKey, recipientPublicKey)

    return [AsymmetricCiphertextPrefix, nonce, ciphertext].join(':')
  }

  asymmetricDecryptKey(
    keyToDecrypt: AsymmetricallyEncryptedKey,
    senderPublicKey: HexString,
    recipientSecretKey: HexString,
  ): Utf8String {
    const components = keyToDecrypt.split(':')

    const nonce = components[1]

    return this.crypto.sodiumCryptoBoxEasyDecrypt(keyToDecrypt, nonce, senderPublicKey, recipientSecretKey)
  }

  symmetricEncryptPrivateKey(privateKey: HexString, symmetricKey: HexString): SymmetricallyEncryptedPrivateKey {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const nonce = this.crypto.generateRandomKey(V005Algorithm.SymmetricEncryptionNonceLength)

    const encryptedKey = this.crypto.xchacha20Encrypt(privateKey, nonce, symmetricKey)

    return [SymmetricCiphertextPrefix, nonce, encryptedKey].join(':')
  }

  symmetricDecryptPrivateKey(
    encryptedPrivateKey: SymmetricallyEncryptedPrivateKey,
    symmetricKey: HexString,
  ): HexString | null {
    if (symmetricKey.length !== 64) {
      throw new Error('Symmetric key length must be 256 bits')
    }

    const components = encryptedPrivateKey.split(':')

    const nonce = components[1]

    return this.crypto.xchacha20Decrypt(encryptedPrivateKey, nonce, symmetricKey)
  }
}
