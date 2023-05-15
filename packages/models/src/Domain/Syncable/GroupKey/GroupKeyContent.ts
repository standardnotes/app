import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'

export type GroupKeyContentSpecialized = {
  key: string
  version: ProtocolVersion
}

export type GroupKeyContent = GroupKeyContentSpecialized & ItemContent
