import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { ServerItemResponse } from './ServerItemResponse'

export type GetSingleItemResponse = DeprecatedMinimalHttpResponse & {
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
