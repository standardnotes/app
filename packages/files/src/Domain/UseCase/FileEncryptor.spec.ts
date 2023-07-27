import { FileContent } from '@standardnotes/models'
import { PureCryptoInterface, StreamEncryptor, SodiumTag } from '@standardnotes/sncrypto-common'
import { FileEncryptor } from './FileEncryptor'

describe('file encryptor', () => {
  let encryptor: FileEncryptor
  let file: { key: FileContent['key']; remoteIdentifier: FileContent['remoteIdentifier'] }
  let crypto: PureCryptoInterface

  beforeEach(() => {
    crypto = {} as jest.Mocked<PureCryptoInterface>
    crypto.xchacha20StreamInitEncryptor = jest.fn().mockReturnValue({
      header: 'some-header',
      state: {},
    } as StreamEncryptor)

    crypto.xchacha20StreamEncryptorPush = jest.fn().mockReturnValue(new Uint8Array())

    file = {
      remoteIdentifier: '123',
      key: 'secret',
    }

    encryptor = new FileEncryptor(file, crypto)
  })

  it('should initialize header', () => {
    const header = encryptor.initializeHeader()

    expect(header.length).toBeGreaterThan(0)
  })

  it('pushBytes should return encrypted bytes', () => {
    encryptor.initializeHeader()
    const encryptedBytes = encryptor.pushBytes(new Uint8Array(), false)

    expect(encryptedBytes).toBeInstanceOf(Uint8Array)
  })

  it('pushBytes with last chunk should pass final tag', () => {
    encryptor.initializeHeader()
    const decryptedBytes = new Uint8Array()
    encryptor.pushBytes(decryptedBytes, true)

    expect(crypto.xchacha20StreamEncryptorPush).toHaveBeenCalledWith(
      expect.any(Object),
      decryptedBytes,
      file.remoteIdentifier,
      SodiumTag.CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL,
    )
  })

  it('pushBytes with not last chunk should not pass final tag', () => {
    encryptor.initializeHeader()
    const decryptedBytes = new Uint8Array()
    encryptor.pushBytes(decryptedBytes, false)

    expect(crypto.xchacha20StreamEncryptorPush).toHaveBeenCalledWith(
      expect.any(Object),
      decryptedBytes,
      file.remoteIdentifier,
      undefined,
    )
  })
})
