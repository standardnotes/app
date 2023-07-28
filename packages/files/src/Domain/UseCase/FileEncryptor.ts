import { FileContent } from '@standardnotes/models'
import { PureCryptoInterface, StreamEncryptor, SodiumTag } from '@standardnotes/sncrypto-common'

export class FileEncryptor {
  private stream!: StreamEncryptor

  constructor(
    private readonly file: { key: FileContent['key']; remoteIdentifier: FileContent['remoteIdentifier'] },
    private crypto: PureCryptoInterface,
  ) {}

  public initializeHeader(): string {
    this.stream = this.crypto.xchacha20StreamInitEncryptor(this.file.key)

    return this.stream.header
  }

  public pushBytes(decryptedBytes: Uint8Array, isFinalChunk: boolean): Uint8Array {
    if (!this.stream) {
      throw new Error('FileEncryptor must call initializeHeader first')
    }

    const tag = isFinalChunk ? SodiumTag.CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL : undefined

    const encryptedBytes = this.crypto.xchacha20StreamEncryptorPush(
      this.stream,
      decryptedBytes,
      this.file.remoteIdentifier,
      tag,
    )

    return encryptedBytes
  }
}
