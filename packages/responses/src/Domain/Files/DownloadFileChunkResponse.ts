import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type DownloadFileChunkResponse = MinimalHttpResponse & {
  data: ArrayBuffer
}
