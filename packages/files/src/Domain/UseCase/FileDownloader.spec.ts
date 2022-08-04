import { FileContent } from '@standardnotes/models'
import { FilesApiInterface } from '../Api/FilesApiInterface'
import { FileDownloader } from './FileDownloader'

describe('file downloader', () => {
  let apiService: FilesApiInterface
  let downloader: FileDownloader
  let file: {
    encryptedChunkSizes: FileContent['encryptedChunkSizes']
    remoteIdentifier: FileContent['remoteIdentifier']
  }

  const numChunks = 5

  beforeEach(() => {
    apiService = {} as jest.Mocked<FilesApiInterface>
    apiService.createFileValetToken = jest.fn()
    apiService.downloadFile = jest
      .fn()
      .mockImplementation(
        (
          _file: string,
          _chunkIndex: number,
          _apiToken: string,
          _rangeStart: number,
          onBytesReceived: (bytes: Uint8Array) => void,
        ) => {
          return new Promise<void>((resolve) => {
            for (let i = 0; i < numChunks; i++) {
              onBytesReceived(Uint8Array.from([0xaa]))
            }

            resolve()
          })
        },
      )

    file = {
      encryptedChunkSizes: [100_000],
      remoteIdentifier: '123',
    }
  })

  it('should pass back bytes as they are received', async () => {
    let receivedBytes = new Uint8Array()

    downloader = new FileDownloader(file, apiService)

    expect(receivedBytes.length).toBe(0)

    // eslint-disable-next-line @typescript-eslint/require-await
    await downloader.run(async (encryptedBytes) => {
      receivedBytes = new Uint8Array([...receivedBytes, ...encryptedBytes])
    })

    expect(receivedBytes.length).toEqual(numChunks)
  })
})
