export class OrderedByteChunker {
  private bytes = new Uint8Array()
  private index = 1
  private remainingChunks: number[] = []

  constructor(
    private chunkSizes: number[],
    private onChunk: (chunk: Uint8Array, index: number, isLast: boolean) => Promise<void>,
  ) {
    this.remainingChunks = chunkSizes.slice()
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

    await this.onChunk(chunk, this.index++, this.index === this.chunkSizes.length - 1)

    if (this.needsPop()) {
      await this.popBytes()
    }
  }
}
