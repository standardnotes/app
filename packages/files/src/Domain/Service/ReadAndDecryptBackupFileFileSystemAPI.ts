import { FileContent } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { FileDecryptor } from '../UseCase/FileDecryptor'
import { FileSystemApi } from '../Api/FileSystemApi'
import { FileHandleRead } from '../Api/FileHandleRead'
import { OrderedByteChunker } from '../Chunker/OrderedByteChunker'

export async function readAndDecryptBackupFileUsingFileSystemAPI(
  fileHandle: FileHandleRead,
  file: {
    encryptionHeader: FileContent['encryptionHeader']
    remoteIdentifier: FileContent['remoteIdentifier']
    encryptedChunkSizes: FileContent['encryptedChunkSizes']
    key: FileContent['key']
  },
  fileSystem: FileSystemApi,
  crypto: PureCryptoInterface,
  onDecryptedBytes: (decryptedBytes: Uint8Array) => Promise<void>,
): Promise<'aborted' | 'failed' | 'success'> {
  const decryptor = new FileDecryptor(file, crypto)

  const byteChunker = new OrderedByteChunker(file.encryptedChunkSizes, 'local', async (chunk) => {
    const decryptResult = decryptor.decryptBytes(chunk.data)

    if (!decryptResult) {
      return
    }

    await onDecryptedBytes(decryptResult.decryptedBytes)
  })

  const readResult = await fileSystem.readFile(fileHandle, async (encryptedBytes: Uint8Array) => {
    await byteChunker.addBytes(encryptedBytes)
  })

  return readResult
}
