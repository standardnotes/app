import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'

export type CloseUploadSessionResponse = MinimalHttpResponse & {
  success: boolean
  message: string
}
