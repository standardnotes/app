import { HttpResponse } from '../Http/HttpResponse'

export type DownloadFileChunkResponse = HttpResponse & {
  data: ArrayBuffer
}
