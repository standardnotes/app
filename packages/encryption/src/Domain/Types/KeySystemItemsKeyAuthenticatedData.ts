import { ProtocolVersion } from '@standardnotes/common'
import { ItemAuthenticatedData } from './ItemAuthenticatedData'

/** Authenticated data for key system items key payloads */
export type KeySystemItemsKeyAuthenticatedData = ItemAuthenticatedData & {
  keyTimestamp: number
  keyVersion: ProtocolVersion
}
