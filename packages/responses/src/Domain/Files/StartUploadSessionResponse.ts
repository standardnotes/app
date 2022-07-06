import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type StartUploadSessionResponse = MinimalHttpResponse & {
  success: boolean
  uploadId: string
}
