import { HttpResponse } from '../Http/HttpResponse'

export type StartUploadSessionResponse = HttpResponse & {
  success: boolean
  uploadId: string
}
