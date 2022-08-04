import { EncryptAndUploadFileOperation } from './EncryptAndUpload'
import { PureCryptoInterface, StreamEncryptor } from '@standardnotes/sncrypto-common'
import { FileContent } from '@standardnotes/models'

import { FilesApiInterface } from '../Api/FilesApiInterface'

describe('encrypt and upload', () => {
  let apiService: FilesApiInterface
  let operation: EncryptAndUploadFileOperation
  let file: {
    decryptedSize: FileContent['decryptedSize']
    key: FileContent['key']
    remoteIdentifier: FileContent['remoteIdentifier']
  }
  let crypto: PureCryptoInterface

  const chunkOfSize = (size: number) => {
    return new TextEncoder().encode('a'.repeat(size))
  }

  beforeEach(() => {
    apiService = {} as jest.Mocked<FilesApiInterface>
    apiService.uploadFileBytes = jest.fn().mockReturnValue(true)

    crypto = {} as jest.Mocked<PureCryptoInterface>

    crypto.xchacha20StreamInitEncryptor = jest.fn().mockReturnValue({
      header: 'some-header',
      state: {},
    } as StreamEncryptor)

    crypto.xchacha20StreamEncryptorPush = jest.fn().mockReturnValue(new Uint8Array())

    file = {
      remoteIdentifier: '123',
      key: 'secret',
      decryptedSize: 100,
    }
  })

  it('should initialize encryption header', () => {
    operation = new EncryptAndUploadFileOperation(file, 'api-token', crypto, apiService)

    expect(operation.getResult().encryptionHeader.length).toBeGreaterThan(0)
  })

  it('should return true when a chunk is uploaded', async () => {
    operation = new EncryptAndUploadFileOperation(file, 'api-token', crypto, apiService)

    const bytes = new Uint8Array()
    const success = await operation.pushBytes(bytes, 2, false)

    expect(success).toEqual(true)
  })

  it('should correctly report progress', async () => {
    operation = new EncryptAndUploadFileOperation(file, 'api-token', crypto, apiService)

    const bytes = chunkOfSize(60)
    await operation.pushBytes(bytes, 2, false)

    const progress = operation.getProgress()

    expect(progress.decryptedFileSize).toEqual(100)
    expect(progress.decryptedBytesUploaded).toEqual(60)
    expect(progress.decryptedBytesRemaining).toEqual(40)
    expect(progress.percentComplete).toEqual(60.0)
  })
})
