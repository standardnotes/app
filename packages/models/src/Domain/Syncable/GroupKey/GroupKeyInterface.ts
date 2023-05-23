import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { GroupKeyContent } from './GroupKeyContent'

export interface GroupKeyInterface extends DecryptedItemInterface<GroupKeyContent> {
  groupUuid: string
  groupName?: string
  groupDescription?: string
  groupKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion

  get itemsKey(): string
}
