import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type UploadFileChunkResponse = MinimalHttpResponse & {
  success: boolean
}
