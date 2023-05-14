import { ItemContent } from '../../Abstract/Content/ItemContent'
import { SharedItemDuration } from './SharedItemDuration'
import { SharedItemPermission } from './SharedItemPermission'

export type SharedItemContentSpecialized = {
  itemUuid: string
  shareToken: string
  privateKey: string
  publicKey: string
  duration: SharedItemDuration
  isUserOriginator: boolean
  permissions: SharedItemPermission
  expired: boolean
}

export type SharedItemContent = SharedItemContentSpecialized & ItemContent
