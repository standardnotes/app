import { EncryptedPayloadInterface } from '@standardnotes/models'
import { SharedItemsUserShare } from './SharedItemsUserShare'

export interface SharingApiInterface {
  getSharedItem(
    shareToken: string,
  ): Promise<{ item: EncryptedPayloadInterface; encryptedContentKey: string; publicKey: string }>

  shareItem(params: { itemUuid: string; encryptedContentKey: string; publicKey: string }): Promise<SharedItemsUserShare>

  updateSharedItem(params: {
    shareToken: string
    encryptedContentKey: string
  }): Promise<SharedItemsUserShare | { error: { tag: 'expired' } }>

  getInitiatedShares(): Promise<SharedItemsUserShare[]>
}
