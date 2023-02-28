import { HttpSuccessResponse } from '../Http/HttpResponse'
import { ServerItemResponse } from './ServerItemResponse'

export type GetSingleItemResponse = HttpSuccessResponse<
  | {
      success: true
      item: ServerItemResponse
    }
  | {
      success: false
      message: string
    }
>
