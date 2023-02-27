import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type CloseUploadSessionResponse = DeprecatedMinimalHttpResponse & {
  success: boolean
  message: string
}
