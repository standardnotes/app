import { OnChunkCallbackNoProgress } from './OnChunkCallback'

export class ByteChunker {
  public loggingEnabled = false
  private bytes = new Uint8Array()
  private index = 1

  constructor(
    private minimumChunkSize: number,
    private onChunk: OnChunkCallbackNoProgress,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(...args: any[]): void {
    if (!this.loggingEnabled) {
      return
    }
    // eslint-disable-next-line no-console
    console.log(args)
  }

  public async addBytes(bytes: Uint8Array, isLast: boolean): Promise<void> {
    this.bytes = new Uint8Array([...this.bytes, ...bytes])

    this.log(`Chunker adding ${bytes.length}, total size ${this.bytes.length}`)

    if (this.bytes.length >= this.minimumChunkSize || isLast) {
      await this.popBytes(isLast)
    }
  }

  private async popBytes(isLast: boolean): Promise<void> {
    const maxIndex = Math.max(this.minimumChunkSize, this.bytes.length)

    const chunk = this.bytes.slice(0, maxIndex)

    this.bytes = new Uint8Array([...this.bytes.slice(maxIndex)])

    this.log(`Chunker popping ${chunk.length}, total size in queue ${this.bytes.length}`)

    await this.onChunk({ data: chunk, index: this.index++, isLast })
  }
}
