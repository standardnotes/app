import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ShareGroupKeyPermission } from './ShareGroupKeyPermission'

export type ShareGroupKeyContentSpecialized = {
  apiToken: string
  privateKey: string
  publicKey: string
  groupKey: string
  isUserOriginator: boolean
  permissions: ShareGroupKeyPermission
  version: ProtocolVersion
}

export type ShareGroupKeyContent = ShareGroupKeyContentSpecialized & ItemContent
