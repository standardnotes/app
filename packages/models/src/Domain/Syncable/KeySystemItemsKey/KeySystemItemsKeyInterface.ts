import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { KeySystemItemsKeyContent } from './KeySystemItemsKeyContent'

export interface KeySystemItemsKeyInterface extends DecryptedItemInterface<KeySystemItemsKeyContent> {
  readonly creationTimestamp: number
  readonly rootKeyToken: string

  get keyVersion(): ProtocolVersion
  get itemsKey(): string
}
