import { GroupInviteServerHash } from './../Groups/GroupInviteServerHash'
import { ContactServerHash } from '../Contact/ContactServerHash'
import { ApiEndpointParam } from './ApiEndpointParam'
import { ConflictParams } from './ConflictParams'
import { ServerItemResponse } from './ServerItemResponse'
import { GroupServerHash } from '../Groups/GroupServerHash'

export type RawSyncData = {
  error?: unknown
  [ApiEndpointParam.LastSyncToken]?: string
  [ApiEndpointParam.PaginationToken]?: string
  retrieved_items?: ServerItemResponse[]
  saved_items?: ServerItemResponse[]
  conflicts?: ConflictParams[]
  unsaved?: ConflictParams[]
  groups?: GroupServerHash[]
  group_invites?: GroupInviteServerHash[]
  contacts?: ContactServerHash[]
  status?: number
}
