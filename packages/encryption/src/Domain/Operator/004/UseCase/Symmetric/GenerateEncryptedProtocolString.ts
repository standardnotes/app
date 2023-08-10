import { Base64String, HexString, PureCryptoInterface, Utf8String } from '@standardnotes/sncrypto-common'
import { V004PartitionCharacter, V004StringComponents } from '../../V004AlgorithmTypes'
import { ProtocolVersion } from '@standardnotes/models'
import { V004Algorithm } from '../../../../Algorithm'

export class GenerateEncryptedProtocolStringUseCase {
  constructor(private readonly crypto: PureCryptoInterface) {}

  execute(plaintext: string, rawKey: string, authenticatedData: string, additionalData: string): string {
    const nonce = this.crypto.generateRandomKey(V004Algorithm.EncryptionNonceLength)

    const ciphertext = this.encryptString(plaintext, rawKey, nonce, authenticatedData)

    const components: V004StringComponents = [
      ProtocolVersion.V004 as string,
      nonce,
      ciphertext,
      authenticatedData,
      additionalData,
    ]

    return components.join(V004PartitionCharacter)
  }

  encryptString(
    plaintext: Utf8String,
    rawKey: HexString,
    nonce: HexString,
    authenticatedData: Utf8String,
  ): Base64String {
    if (!nonce) {
      throw 'encryptString null nonce'
    }

    if (!rawKey) {
      throw 'encryptString null rawKey'
    }

    return this.crypto.xchacha20Encrypt(plaintext, nonce, rawKey, authenticatedData)
  }
}
