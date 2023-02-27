import { HttpResponse } from '../Http/HttpResponse'

export type CloseUploadSessionResponse = HttpResponse & {
  success: boolean
  message: string
}
