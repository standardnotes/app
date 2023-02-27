import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'

export type StartUploadSessionResponse = DeprecatedMinimalHttpResponse & {
  success: boolean
  uploadId: string
}
