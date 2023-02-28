import { HttpSuccessResponse } from '../Http/HttpResponse'

export type StartUploadSessionResponse = HttpSuccessResponse<{
  success: boolean
  uploadId: string
}>
