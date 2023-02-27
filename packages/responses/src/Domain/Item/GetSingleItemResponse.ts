import { HttpResponse } from '../Http/HttpResponse'
import { ServerItemResponse } from './ServerItemResponse'

export type GetSingleItemResponse = HttpResponse & {
  data:
    | {
        success: true
        item: ServerItemResponse
      }
    | {
        success: false
        message: string
      }
}
