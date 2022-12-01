import { FileContent } from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { FileDecryptor } from '../UseCase/FileDecryptor'
import { OrderedByteChunker } from '../Chunker/OrderedByteChunker'
import { BackupServiceInterface } from './BackupServiceInterface'
import { OnChunkCallback } from '../Chunker/OnChunkCallback'
import { log, LoggingDomain } from '../Logging'

export async function readAndDecryptBackupFileUsingBackupService(
  file: {
    uuid: string
    encryptionHeader: FileContent['encryptionHeader']
    remoteIdentifier: FileContent['remoteIdentifier']
    encryptedChunkSizes: FileContent['encryptedChunkSizes']
    key: FileContent['key']
  },
  backupService: BackupServiceInterface,
  crypto: PureCryptoInterface,
  onDecryptedBytes: OnChunkCallback,
): Promise<'aborted' | 'failed' | 'success'> {
  log(
    LoggingDomain.FilesPackage,
    'Reading and decrypting backup file',
    file.uuid,
    'chunk sizes',
    file.encryptedChunkSizes,
  )

  const decryptor = new FileDecryptor(file, crypto)

  const byteChunker = new OrderedByteChunker(file.encryptedChunkSizes, 'local', async (chunk) => {
    log(LoggingDomain.FilesPackage, 'OrderedByteChunker did pop bytes', chunk.data.length, chunk.progress)

    const decryptResult = decryptor.decryptBytes(chunk.data)

    if (!decryptResult) {
      return
    }

    await onDecryptedBytes({ ...chunk, data: decryptResult.decryptedBytes })
  })

  const readResult = await backupService.readEncryptedFileFromBackup(file.uuid, async (chunk) => {
    log(LoggingDomain.FilesPackage, 'Got file chunk from backup service', chunk.data.length, chunk.progress)

    await byteChunker.addBytes(chunk.data)
  })

  log(LoggingDomain.FilesPackage, 'Finished reading and decrypting backup file', file.uuid)

  return readResult
}
