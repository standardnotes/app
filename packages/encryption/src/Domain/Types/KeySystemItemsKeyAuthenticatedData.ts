import { ItemAuthenticatedData } from './ItemAuthenticatedData'
import { KeySystemRootKeyParamsInterface } from '@standardnotes/models'

/** Authenticated data for key system items key payloads */
export type KeySystemItemsKeyAuthenticatedData = ItemAuthenticatedData & {
  kp: KeySystemRootKeyParamsInterface
}
