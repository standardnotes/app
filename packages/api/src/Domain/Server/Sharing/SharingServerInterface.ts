import { ContentType } from '@standardnotes/common'
import {
  HttpResponse,
  GetSharedItemResponse,
  ItemSharePostResponse,
  SharedItemsUserShare,
  GetUserItemSharesResponse,
} from '@standardnotes/responses'

export interface SharingServerInterface {
  getSharedItem(shareToken: string, thirdPartyHost?: string): Promise<HttpResponse<GetSharedItemResponse>>

  shareItem(params: {
    itemUuid: string
    encryptedContentKey: string
    publicKey: string
    fileRemoteIdentifier?: string
    contentType: ContentType
    duration: string
  }): Promise<HttpResponse<ItemSharePostResponse>>

  updateSharedItem(params: {
    shareToken: string
    encryptedContentKey: string
  }): Promise<HttpResponse<SharedItemsUserShare>>

  getInitiatedShares(): Promise<HttpResponse<GetUserItemSharesResponse>>
}
