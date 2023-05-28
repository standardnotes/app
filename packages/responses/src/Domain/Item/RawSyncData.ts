import { VaultInviteServerHash } from '../Vaults/VaultInviteServerHash'
import { ContactServerHash } from '../Contact/ContactServerHash'
import { ApiEndpointParam } from './ApiEndpointParam'
import { ConflictParams } from './ConflictParams'
import { ServerItemResponse } from './ServerItemResponse'
import { VaultServerHash } from '../Vaults/VaultServerHash'

export type RawSyncData = {
  error?: unknown
  [ApiEndpointParam.LastSyncToken]?: string
  [ApiEndpointParam.PaginationToken]?: string
  retrieved_items?: ServerItemResponse[]
  saved_items?: ServerItemResponse[]
  conflicts?: ConflictParams[]
  unsaved?: ConflictParams[]
  vaults?: VaultServerHash[]
  vault_invites?: VaultInviteServerHash[]
  contacts?: ContactServerHash[]
  status?: number
}
