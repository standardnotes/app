import { PureCryptoInterface, StreamDecryptor, SodiumTag } from '@standardnotes/sncrypto-common'
import { FileContent } from '@standardnotes/models'

export class FileDecryptor {
  private decryptor: StreamDecryptor

  constructor(
    private file: {
      encryptionHeader: FileContent['encryptionHeader']
      remoteIdentifier: FileContent['remoteIdentifier']
      key: FileContent['key']
    },
    private crypto: PureCryptoInterface,
  ) {
    this.decryptor = this.crypto.xchacha20StreamInitDecryptor(this.file.encryptionHeader, this.file.key)
  }

  public decryptBytes(encryptedBytes: Uint8Array): { decryptedBytes: Uint8Array; isFinalChunk: boolean } | undefined {
    const result = this.crypto.xchacha20StreamDecryptorPush(this.decryptor, encryptedBytes, this.file.remoteIdentifier)

    if (result === false) {
      return undefined
    }

    const isFinal = result.tag === SodiumTag.CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL

    return { decryptedBytes: result.message, isFinalChunk: isFinal }
  }
}
