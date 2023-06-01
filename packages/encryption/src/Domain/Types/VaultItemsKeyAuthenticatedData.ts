import { ProtocolVersion } from '@standardnotes/common'
import { ItemAuthenticatedData } from './ItemAuthenticatedData'

export type VaultItemsKeyAuthenticatedData = ItemAuthenticatedData & {
  vaultKeyTimestamp: number
  vaultKeyVersion: ProtocolVersion
}
