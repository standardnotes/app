import { createWriteStream, WriteStream } from 'fs'
import { downloadData } from './FileNetworking'

export class FileDownloader {
  writeStream: WriteStream

  constructor(
    private chunkSizes: number[],
    private valetToken: string,
    private url: string,
    filePath: string,
  ) {
    this.writeStream = createWriteStream(filePath, { flags: 'a' })
  }

  public async run(): Promise<'success' | 'failed'> {
    const result = await this.downloadChunk(0, 0)

    this.writeStream.close()

    return result
  }

  private async downloadChunk(chunkIndex = 0, contentRangeStart: number): Promise<'success' | 'failed'> {
    const pullChunkSize = this.chunkSizes[chunkIndex]

    const headers = {
      'x-valet-token': this.valetToken,
      'x-chunk-size': pullChunkSize.toString(),
      range: `bytes=${contentRangeStart}-`,
    }

    const response = await downloadData(this.writeStream, this.url, headers)

    if (!String(response.status).startsWith('2')) {
      return 'failed'
    }

    const contentRangeHeader = response.headers['content-range'] as string
    if (!contentRangeHeader) {
      return 'failed'
    }

    const matches = contentRangeHeader.match(/(^[a-zA-Z][\w]*)\s+(\d+)\s?-\s?(\d+)?\s?\/?\s?(\d+|\*)?/)
    if (!matches || matches.length !== 5) {
      return 'failed'
    }

    const rangeStart = +matches[2]
    const rangeEnd = +matches[3]
    const totalSize = +matches[4]

    if (rangeEnd < totalSize - 1) {
      return this.downloadChunk(++chunkIndex, rangeStart + pullChunkSize)
    }

    return 'success'
  }
}
