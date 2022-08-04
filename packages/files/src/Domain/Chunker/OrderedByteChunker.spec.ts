import { OrderedByteChunker } from './OrderedByteChunker'

const chunkOfSize = (size: number) => {
  return new TextEncoder().encode('a'.repeat(size))
}

describe('ordered byte chunker', () => {
  it('should callback multiple times if added bytes matches multiple chunk sizes', async () => {
    const chunkSizes = [10, 10, 10]
    let receivedBytes = new Uint8Array()
    let numCallbacks = 0

    const chunker = new OrderedByteChunker(chunkSizes, async (bytes) => {
      numCallbacks++
      receivedBytes = new Uint8Array([...receivedBytes, ...bytes])
    })

    await chunker.addBytes(chunkOfSize(30))

    expect(numCallbacks).toEqual(3)
    expect(receivedBytes.length).toEqual(30)
  })
})
