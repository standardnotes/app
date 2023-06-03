import { SharedVaultInviteServerHash } from '../SharedVaults/SharedVaultInviteServerHash'
import { ContactServerHash } from '../Contact/ContactServerHash'
import { ApiEndpointParam } from './ApiEndpointParam'
import { ConflictParams } from './ConflictParams'
import { ServerItemResponse } from './ServerItemResponse'
import { SharedVaultServerHash } from '../SharedVaults/SharedVaultServerHash'

export type RawSyncData = {
  error?: unknown
  [ApiEndpointParam.LastSyncToken]?: string
  [ApiEndpointParam.PaginationToken]?: string
  retrieved_items?: ServerItemResponse[]
  saved_items?: ServerItemResponse[]
  conflicts?: ConflictParams[]
  unsaved?: ConflictParams[]
  shared_vaults?: SharedVaultServerHash[]
  shared_vault_invites?: SharedVaultInviteServerHash[]
  contacts?: ContactServerHash[]
  status?: number
}
