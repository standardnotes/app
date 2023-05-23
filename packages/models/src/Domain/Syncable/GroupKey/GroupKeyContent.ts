import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type GroupKeyContentSpecialized = {
  groupUuid: string
  groupName?: string
  groupDescription?: string
  groupKey: string
  keyTimestamp: number
  keyVersion: ProtocolVersion
}

export type GroupKeyContent = GroupKeyContentSpecialized & ItemContent
