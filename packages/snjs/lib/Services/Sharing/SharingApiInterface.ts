import { HttpResponse, ItemSharePostResponse, GetUserItemSharesResponse } from '@standardnotes/responses'
import { SharedItemsUserShare } from './SharedItemsUserShare'
import { GetSharedItemResponse } from './GetSharedItemResponse'
import { ContentType } from '@standardnotes/common'

export interface SharingApiInterface {
  getSharedItem(shareToken: string): Promise<HttpResponse<GetSharedItemResponse>>

  shareItem(params: {
    itemUuid: string
    encryptedContentKey: string
    publicKey: string
    fileRemoteIdentifier?: string
    contentType: ContentType
  }): Promise<HttpResponse<ItemSharePostResponse>>

  updateSharedItem(params: {
    shareToken: string
    encryptedContentKey: string
  }): Promise<HttpResponse<SharedItemsUserShare>>

  getInitiatedShares(): Promise<HttpResponse<GetUserItemSharesResponse>>
}
