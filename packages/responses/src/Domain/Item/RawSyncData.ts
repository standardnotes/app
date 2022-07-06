import { ApiEndpointParam } from './ApiEndpointParam'
import { ConflictParams } from './ConflictParams'
import { ServerItemResponse } from './ServerItemResponse'

export type RawSyncData = {
  error?: unknown
  [ApiEndpointParam.LastSyncToken]?: string
  [ApiEndpointParam.PaginationToken]?: string
  retrieved_items?: ServerItemResponse[]
  saved_items?: ServerItemResponse[]
  conflicts?: ConflictParams[]
  unsaved?: ConflictParams[]
  status?: number
}
