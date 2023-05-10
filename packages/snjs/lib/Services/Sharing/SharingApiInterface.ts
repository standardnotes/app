import { HttpResponse, ItemSharePostResponse, GetUserItemSharesResponse } from '@standardnotes/responses'
import { EncryptedPayloadInterface } from '@standardnotes/models'
import { SharedItemsUserShare } from './SharedItemsUserShare'

export type GetSharedItemResponse = {
  item: EncryptedPayloadInterface
  itemShare: SharedItemsUserShare
}

export interface SharingApiInterface {
  getSharedItem(shareToken: string): Promise<HttpResponse<GetSharedItemResponse>>

  shareItem(params: {
    itemUuid: string
    encryptedContentKey: string
    publicKey: string
  }): Promise<HttpResponse<ItemSharePostResponse>>

  updateSharedItem(params: {
    shareToken: string
    encryptedContentKey: string
  }): Promise<HttpResponse<SharedItemsUserShare>>

  getInitiatedShares(): Promise<HttpResponse<GetUserItemSharesResponse>>
}
