import { HttpResponse } from '../Http/HttpResponse'

export type UploadFileChunkResponse = HttpResponse & {
  success: boolean
}
