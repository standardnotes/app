import { FileContent } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { FileDecryptor } from '../UseCase/FileDecryptor'
import { OrderedByteChunker } from '../Chunker/OrderedByteChunker'
import { BackupServiceInterface } from './BackupServiceInterface'

export async function readAndDecryptBackupFileUsingNodeAPI(
  file: {
    uuid: string
    encryptionHeader: FileContent['encryptionHeader']
    remoteIdentifier: FileContent['remoteIdentifier']
    encryptedChunkSizes: FileContent['encryptedChunkSizes']
    key: FileContent['key']
  },
  backupService: BackupServiceInterface,
  crypto: PureCryptoInterface,
  onDecryptedBytes: (decryptedBytes: Uint8Array) => Promise<void>,
): Promise<'aborted' | 'failed' | 'success'> {
  const decryptor = new FileDecryptor(file, crypto)

  const byteChunker = new OrderedByteChunker(file.encryptedChunkSizes, async (chunk: Uint8Array) => {
    const decryptResult = decryptor.decryptBytes(chunk)

    if (!decryptResult) {
      return
    }

    await onDecryptedBytes(decryptResult.decryptedBytes)
  })

  const readResult = await backupService.readFileFromBackup(file.uuid, async (encryptedBytes: Uint8Array) => {
    await byteChunker.addBytes(encryptedBytes)
  })

  return readResult
}
