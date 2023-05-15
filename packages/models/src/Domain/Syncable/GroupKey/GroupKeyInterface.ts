import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { GroupKeyContent } from './GroupKeyContent'

export interface GroupKeyInterface extends DecryptedItemInterface<GroupKeyContent> {
  readonly key: string
  get itemsKey(): string
  get keyVersion(): ProtocolVersion
}
