import { FileBackupReadChunkResponse } from '@web/Application/Device/DesktopSnjsExports'
import fs from 'fs'

const ONE_MB = 1024 * 1024
const CHUNK_LIMIT = ONE_MB * 5

export class FileReadOperation {
  public readonly token: string
  private currentChunkLocation = 0
  private localFileId: number
  private fileLength: number

  constructor(filePath: string) {
    this.token = filePath
    this.localFileId = fs.openSync(filePath, 'r')
    this.fileLength = fs.fstatSync(this.localFileId).size
  }

  async readNextChunk(): Promise<FileBackupReadChunkResponse> {
    let isLast = false
    let readUpto = this.currentChunkLocation + CHUNK_LIMIT
    if (readUpto > this.fileLength) {
      readUpto = this.fileLength
      isLast = true
    }

    const readLength = readUpto - this.currentChunkLocation

    const chunk = await this.readChunk(this.currentChunkLocation, readLength)

    this.currentChunkLocation = readUpto

    if (isLast) {
      fs.close(this.localFileId)
    }

    return {
      chunk,
      isLast,
      progress: {
        encryptedFileSize: this.fileLength,
        encryptedBytesDownloaded: this.currentChunkLocation,
        encryptedBytesRemaining: this.fileLength - this.currentChunkLocation,
        percentComplete: (this.currentChunkLocation / this.fileLength) * 100.0,
        source: 'local',
      },
    }
  }

  async readChunk(start: number, length: number): Promise<Uint8Array> {
    const buffer = Buffer.alloc(length)

    fs.readSync(this.localFileId, buffer, 0, length, start)

    return buffer
  }
}
