import { ConflictType } from './ConflictType'
import { ServerItemResponse } from './ServerItemResponse'

export type ConflictParams = {
  type: ConflictType
  server_item?: ServerItemResponse
  unsaved_item?: ServerItemResponse

  /** @legacay */
  item?: ServerItemResponse
}
