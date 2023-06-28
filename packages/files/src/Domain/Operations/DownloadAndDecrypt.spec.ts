import { sleep } from '@standardnotes/utils'
import { PureCryptoInterface, StreamEncryptor } from '@standardnotes/sncrypto-common'
import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { DownloadAndDecryptFileOperation } from './DownloadAndDecrypt'
import { FileContent } from '@standardnotes/models'
import { FilesApiInterface } from '../Api/FilesApiInterface'

describe('download and decrypt', () => {
  let apiService: FilesApiInterface
  let operation: DownloadAndDecryptFileOperation
  let file: {
    uuid: string
    encryptedChunkSizes: FileContent['encryptedChunkSizes']
    encryptionHeader: FileContent['encryptionHeader']
    remoteIdentifier: FileContent['remoteIdentifier']
    key: FileContent['key']
    shared_vault_uuid: string | undefined
  }
  let crypto: PureCryptoInterface

  const NumChunks = 5

  const chunkOfSize = (size: number) => {
    return new TextEncoder().encode('a'.repeat(size))
  }

  const downloadChunksOfSize = (size: number) => {
    apiService.downloadFile = jest
      .fn()
      .mockImplementation(
        (params: {
          _file: string
          _chunkIndex: number
          _apiToken: string
          _rangeStart: number
          onBytesReceived: (bytes: Uint8Array) => void
        }) => {
          const receiveFile = async () => {
            for (let i = 0; i < NumChunks; i++) {
              params.onBytesReceived(chunkOfSize(size))

              await sleep(100, false)
            }
          }

          return new Promise<void>((resolve) => {
            void receiveFile().then(resolve)
          })
        },
      )
  }

  beforeEach(() => {
    apiService = {} as jest.Mocked<FilesApiInterface>
    apiService.createUserFileValetToken = jest.fn()
    downloadChunksOfSize(5)

    crypto = {} as jest.Mocked<PureCryptoInterface>

    crypto.xchacha20StreamInitDecryptor = jest.fn().mockReturnValue({
      state: {},
    } as StreamEncryptor)

    crypto.xchacha20StreamDecryptorPush = jest.fn().mockReturnValue({ message: new Uint8Array([0xaa]), tag: 0 })

    file = {
      uuid: '123',
      encryptedChunkSizes: [100_000],
      remoteIdentifier: '123',
      key: 'secret',
      encryptionHeader: 'some-header',
      shared_vault_uuid: undefined,
    }
  })

  it('run should resolve when operation is complete', async () => {
    let receivedBytes = new Uint8Array()

    operation = new DownloadAndDecryptFileOperation(file, crypto, apiService, 'own')

    await operation.run(async (result) => {
      if (result) {
        receivedBytes = new Uint8Array([...receivedBytes, ...result.decrypted.decryptedBytes])
      }

      await Promise.resolve()
    })

    expect(receivedBytes.length).toEqual(NumChunks)
  })

  it('should correctly report progress', async () => {
    file = {
      uuid: '123',
      encryptedChunkSizes: [100_000, 200_000, 200_000],
      remoteIdentifier: '123',
      key: 'secret',
      encryptionHeader: 'some-header',
      shared_vault_uuid: undefined,
    }

    downloadChunksOfSize(100_000)

    operation = new DownloadAndDecryptFileOperation(file, crypto, apiService, 'own')

    const progress: FileDownloadProgress = await new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      void operation.run(async (result) => {
        operation.abort()
        resolve(result.progress)
      })
    })

    expect(progress.encryptedBytesDownloaded).toEqual(100_000)
    expect(progress.encryptedBytesRemaining).toEqual(400_000)
    expect(progress.encryptedFileSize).toEqual(500_000)
    expect(progress.percentComplete).toEqual(20.0)
  })
})
