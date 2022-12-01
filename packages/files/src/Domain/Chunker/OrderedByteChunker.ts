import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { OnChunkCallback } from './OnChunkCallback'

export class OrderedByteChunker {
  private bytes = new Uint8Array()
  private index = 1
  private remainingChunks: number[] = []
  private fileSize: number

  constructor(
    private chunkSizes: number[],
    private source: FileDownloadProgress['source'],
    private onChunk: OnChunkCallback,
  ) {
    this.remainingChunks = chunkSizes.slice()

    this.fileSize = chunkSizes.reduce((acc, size) => acc + size, 0)
  }

  private get bytesPopped(): number {
    return this.fileSize - this.bytesRemaining
  }

  private get bytesRemaining(): number {
    return this.remainingChunks.reduce((acc, size) => acc + size, 0)
  }

  private needsPop(): boolean {
    return this.remainingChunks.length > 0 && this.bytes.length >= this.remainingChunks[0]
  }

  public async addBytes(bytes: Uint8Array): Promise<void> {
    this.bytes = new Uint8Array([...this.bytes, ...bytes])

    if (this.needsPop()) {
      await this.popBytes()
    }
  }

  private async popBytes(): Promise<void> {
    const readUntil = this.remainingChunks[0]

    const chunk = this.bytes.slice(0, readUntil)

    this.bytes = new Uint8Array([...this.bytes.slice(readUntil)])

    this.remainingChunks.shift()

    await this.onChunk({
      data: chunk,
      index: this.index++,
      isLast: this.index === this.chunkSizes.length - 1,
      progress: {
        encryptedFileSize: this.fileSize,
        encryptedBytesDownloaded: this.bytesPopped,
        encryptedBytesRemaining: this.bytesRemaining,
        percentComplete: (this.bytesPopped / this.fileSize) * 100.0,
        source: this.source,
      },
    })

    if (this.needsPop()) {
      await this.popBytes()
    }
  }
}
