import { AnyKeyParamsContent } from '@standardnotes/common'
import { ItemAuthenticatedData } from './ItemAuthenticatedData'

/** Data that is attached to items that are encrypted with a root key */
export type RootKeyEncryptedAuthenticatedData = ItemAuthenticatedData & {
  /** The key params used to generate the root key that encrypts this item key */
  kp: AnyKeyParamsContent
}
