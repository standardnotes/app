import {
  GetSharedItemResponse,
  GetUserItemSharesResponse,
  HttpResponse,
  ItemSharePostResponse,
  SharedItemsUserShare,
} from '@standardnotes/responses'
import { HttpServiceInterface } from '../../Http'
import { SharingServerInterface } from './SharingServerInterface'
import { ContentType } from '@standardnotes/common'
import { SharingPaths } from './Paths'
import { joinPaths } from '@standardnotes/utils'

export class SharingServer implements SharingServerInterface {
  constructor(private httpService: HttpServiceInterface) {}

  async downloadSharedItem(shareToken: string, thirdPartyHost?: string): Promise<HttpResponse<GetSharedItemResponse>> {
    if (thirdPartyHost) {
      return this.httpService.getExternal(joinPaths(thirdPartyHost, SharingPaths.downloadSharedItem(shareToken)))
    } else {
      return this.httpService.get(SharingPaths.downloadSharedItem(shareToken))
    }
  }

  shareItem(params: {
    itemUuid: string
    encryptedContentKey: string
    permissions: string
    fileRemoteIdentifier?: string
    contentType: ContentType
    duration: string
  }): Promise<HttpResponse<ItemSharePostResponse>> {
    return this.httpService.post(SharingPaths.shareItem, {
      itemUuid: params.itemUuid,
      encryptedContentKey: params.encryptedContentKey,
      permissions: params.permissions,
      fileRemoteIdentifier: params.fileRemoteIdentifier,
      contentType: params.contentType,
      duration: params.duration,
    })
  }

  updateSharedItemContentKey(params: {
    shareToken: string
    encryptedContentKey: string
  }): Promise<HttpResponse<SharedItemsUserShare>> {
    return this.httpService.patch(SharingPaths.shareItem, {
      shareToken: params.shareToken,
      encryptedContentKey: params.encryptedContentKey,
    })
  }

  getInitiatedShares(): Promise<HttpResponse<GetUserItemSharesResponse>> {
    return this.httpService.get(SharingPaths.getUserShares)
  }
}
