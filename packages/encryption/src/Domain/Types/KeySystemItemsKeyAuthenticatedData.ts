import { ProtocolVersion } from '@standardnotes/common'
import { ItemAuthenticatedData } from './ItemAuthenticatedData'

/** Authenticated data for payloads encrypted with a key system items key */
export type KeySystemItemsKeyAuthenticatedData = ItemAuthenticatedData & {
  keySystemRootKeyTimestamp: number
  keySystemRootKeyVersion: ProtocolVersion
}
