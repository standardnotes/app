import { EncryptedPayloadInterface } from '@standardnotes/models'
import { SharedItemsUserShare } from './SharedItemsUserShare'

export type GetSharedItemResponse = {
  item: EncryptedPayloadInterface
  itemShare: SharedItemsUserShare
  fileValetToken?: string
}
