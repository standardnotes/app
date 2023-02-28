import { HttpSuccessResponse } from '../Http/HttpResponse'

export type UploadFileChunkResponse = HttpSuccessResponse<{
  success: boolean
}>
