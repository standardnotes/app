import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type UploadFileChunkResponse = DeprecatedMinimalHttpResponse & {
  success: boolean
}
