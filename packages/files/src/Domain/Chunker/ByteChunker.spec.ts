import { ByteChunker } from './ByteChunker'

const chunkOfSize = (size: number) => {
  return new TextEncoder().encode('a'.repeat(size))
}

describe('byte chunker', () => {
  it('should hold back small chunks until minimum size is met', async () => {
    let receivedBytes = new Uint8Array()
    let numChunks = 0
    const chunker = new ByteChunker(100, async (chunk) => {
      numChunks++
      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])
    })

    await chunker.addBytes(chunkOfSize(50), false)
    await chunker.addBytes(chunkOfSize(50), false)
    await chunker.addBytes(chunkOfSize(50), false)
    await chunker.addBytes(chunkOfSize(50), true)

    expect(numChunks).toEqual(2)
    expect(receivedBytes.length).toEqual(200)
  })

  it('should send back big chunks immediately', async () => {
    let receivedBytes = new Uint8Array()
    let numChunks = 0
    const chunker = new ByteChunker(100, async (chunk) => {
      numChunks++
      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])
    })

    await chunker.addBytes(chunkOfSize(150), false)
    await chunker.addBytes(chunkOfSize(150), false)
    await chunker.addBytes(chunkOfSize(150), false)
    await chunker.addBytes(chunkOfSize(50), true)

    expect(numChunks).toEqual(4)
    expect(receivedBytes.length).toEqual(500)
  })

  it('last chunk should be popped regardless of size', async () => {
    let receivedBytes = new Uint8Array()
    let numChunks = 0
    const chunker = new ByteChunker(100, async (chunk) => {
      numChunks++
      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])
    })

    await chunker.addBytes(chunkOfSize(50), false)
    await chunker.addBytes(chunkOfSize(25), true)

    expect(numChunks).toEqual(1)
    expect(receivedBytes.length).toEqual(75)
  })

  it('single chunk should be popped immediately', async () => {
    let receivedBytes = new Uint8Array()
    let numChunks = 0
    const chunker = new ByteChunker(100, async (chunk) => {
      numChunks++
      receivedBytes = new Uint8Array([...receivedBytes, ...chunk.data])
    })

    await chunker.addBytes(chunkOfSize(50), true)

    expect(numChunks).toEqual(1)
    expect(receivedBytes.length).toEqual(50)
  })
})
