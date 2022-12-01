import { OrderedByteChunker } from './OrderedByteChunker'

const chunkOfSize = (size: number) => {
  return new TextEncoder().encode('a'.repeat(size))
}

describe('ordered byte chunker', () => {
  it('should callback multiple times if added bytes matches multiple chunk sizes', async () => {
    const chunkSizes = [10, 10, 10]
    let receivedBytes = new Uint8Array()
    let numCallbacks = 0

    const chunker = new OrderedByteChunker(chunkSizes, 'network', async (chunk) => {
      numCallbacks++
      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])
    })

    await chunker.addBytes(chunkOfSize(30))

    expect(numCallbacks).toEqual(3)
    expect(receivedBytes.length).toEqual(30)
  })

  it('should correctly report progress', async () => {
    const chunkSizes = [10, 10, 10]
    let receivedBytes = new Uint8Array()
    let numCallbacks = 0

    const chunker = new OrderedByteChunker(chunkSizes, 'network', async (chunk) => {
      numCallbacks++

      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])

      expect(chunk.progress.encryptedBytesDownloaded).toEqual(receivedBytes.length)

      expect(chunk.progress.percentComplete).toEqual((numCallbacks / chunkSizes.length) * 100.0)
    })

    await chunker.addBytes(chunkOfSize(30))

    expect(numCallbacks).toEqual(3)
    expect(receivedBytes.length).toEqual(30)
  })
})
