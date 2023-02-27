import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type DownloadFileChunkResponse = DeprecatedMinimalHttpResponse & {
  data: ArrayBuffer
}
