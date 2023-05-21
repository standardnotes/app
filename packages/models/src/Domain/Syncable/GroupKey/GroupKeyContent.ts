import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type GroupKeyContentSpecialized = {
  groupUuid: string
  groupKey: string
  keyVersion: ProtocolVersion
}

export type GroupKeyContent = GroupKeyContentSpecialized & ItemContent
