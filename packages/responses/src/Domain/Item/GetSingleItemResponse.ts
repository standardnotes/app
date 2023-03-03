import { ServerItemResponse } from './ServerItemResponse'

export type GetSingleItemResponse =
  | {
      success: true
      item: ServerItemResponse
    }
  | {
      success: false
      message: string
    }
