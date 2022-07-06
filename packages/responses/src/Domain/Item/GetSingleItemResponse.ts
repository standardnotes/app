import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { ServerItemResponse } from './ServerItemResponse'

export type GetSingleItemResponse = MinimalHttpResponse & {
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
