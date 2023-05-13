import { HttpServiceInterface, SharingServer, SharingServerInterface } from '@standardnotes/api'
import {
  ClientDisplayableError,
  ErrorTag,
  SharedItemsUserShare,
  isClientDisplayableError,
  isErrorResponse,
} from '@standardnotes/responses'
import { ProtocolOperator005, isErrorDecryptingParameters } from '@standardnotes/encryption'
import {
  AbstractService,
  AccountEvent,
  InternalEventBusInterface,
  SyncEvent,
  SyncServiceInterface,
  UserClientInterface,
} from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  FileContent,
  FilterDisallowedRemotePayloadsAndMap,
  PayloadSource,
  ServerSyncPushContextualPayload,
  isDeletedPayload,
} from '@standardnotes/models'
import { CreatePayloadFromRawServerItem } from '../Sync/Account/Utilities'
import {
  SharingServiceEvent,
  SharingServiceGetSharedItemReturn,
  SharingServiceInterface,
  SharingServiceShareItemReturn,
} from './SharingServiceInterface'
import { ContentType } from '@standardnotes/common'
import { DecodedSharingUrl, SharingUrlParams, SharingUrlVersion } from './SharingUrl'
import { isUrlFirstParty } from '@Lib/Hosts'
import { ShareItemDuration } from './ShareItemDuration'

type ItemUuid = string
type ShareItemUuid = string

export class SharingService extends AbstractService<SharingServiceEvent, any> implements SharingServiceInterface {
  private initiatedShares: Record<ItemUuid, Record<ShareItemUuid, SharedItemsUserShare>> = {}
  private operator: ProtocolOperator005
  private sharingServer: SharingServerInterface
  private syncObserverDisposer: () => void
  private userObserverDisposer?: () => void

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    user: UserClientInterface,
    private crypto: PureCryptoInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.sharingServer = new SharingServer(http)
    this.syncObserverDisposer = sync.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.SingleRoundTripSyncCompleted && data) {
        const eventData = data as { uploadedPayloads: ServerSyncPushContextualPayload[] }
        const { uploadedPayloads } = eventData
        if (uploadedPayloads) {
          await this.updateSharesForUpdatedItems(uploadedPayloads)
        }
      }
    })

    this.operator = new ProtocolOperator005(crypto)
    if (user.isSignedIn()) {
      void this.downloadUserShares()
    } else {
      this.userObserverDisposer = user.addEventObserver(async (eventName) => {
        if (eventName === AccountEvent.SignedInOrRegistered) {
          void this.downloadUserShares()
        }
      })
    }
  }

  private async updateSharesForUpdatedItems(pushedPayloads: ServerSyncPushContextualPayload[]): Promise<void> {
    for (const payload of pushedPayloads) {
      const shareRecordsForItem = this.initiatedShares[payload.uuid] ?? {}
      const shares = Object.values(shareRecordsForItem)
      for (const share of shares) {
        void this.updateSharedItem(payload.uuid, share.uuid, share.shareToken, share.publicKey)
      }
    }
  }

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.operator as unknown) = undefined
    ;(this.sharingServer as unknown) = undefined

    this.syncObserverDisposer()
    this.userObserverDisposer?.()
  }

  async downloadUserShares(): Promise<void> {
    const shares = await this.getInitiatedShares()

    for (const share of shares) {
      const record = this.initiatedShares[share.itemUuid] || {}
      record[share.uuid] = share
      this.initiatedShares[share.itemUuid] = record
    }
  }

  async getInitiatedShares(): Promise<SharedItemsUserShare[]> {
    const response = await this.sharingServer.getInitiatedShares()
    if (isErrorResponse(response)) {
      return []
    }
    return response.data.itemShares
  }

  private async updateSharedItem(
    itemUuid: string,
    shareUuid: string,
    shareToken: string,
    publicKey: string,
  ): Promise<ClientDisplayableError | void> {
    const getItemResult = await this.sync.getItemAndContentKey(itemUuid)
    if (!getItemResult) {
      return ClientDisplayableError.FromString('Could not get item to share')
    }

    const encryptedContentKey = this.operator.asymmetricAnonymousEncryptKey(getItemResult.contentKey, publicKey)

    const shareResponse = await this.sharingServer.updateSharedItem({
      shareToken,
      encryptedContentKey: encryptedContentKey,
    })

    if (isErrorResponse(shareResponse)) {
      if (shareResponse.data.error.tag === ErrorTag.ExpiredItemShare) {
        delete this.initiatedShares[itemUuid][shareUuid]
      }

      return ClientDisplayableError.FromError(shareResponse.data.error)
    }

    void this.notifyEvent(SharingServiceEvent.DidUpdateSharedItem, { uuid: itemUuid })
  }

  public async shareItem(
    itemUuid: string,
    duration: ShareItemDuration,
    appHost: string,
  ): Promise<SharingServiceShareItemReturn | ClientDisplayableError> {
    const getItemResult = await this.sync.getItemAndContentKey(itemUuid)
    if (!getItemResult) {
      return ClientDisplayableError.FromString('Could not get item to share')
    }

    const keypair = this.operator.generateKeyPair()

    const encryptedContentKey = this.operator.asymmetricAnonymousEncryptKey(getItemResult.contentKey, keypair.publicKey)

    const shareResponse = await this.sharingServer.shareItem({
      contentType: getItemResult.payload.content_type,
      itemUuid: itemUuid,
      encryptedContentKey: encryptedContentKey,
      publicKey: keypair.publicKey,
      duration: duration,
      fileRemoteIdentifier:
        getItemResult.payload.content_type === ContentType.File
          ? (getItemResult.payload.content as FileContent).remoteIdentifier
          : undefined,
    })

    if (isErrorResponse(shareResponse)) {
      return ClientDisplayableError.FromError(shareResponse.data.error)
    }

    if (shareResponse.data.itemShare.shareToken) {
      const record = this.initiatedShares[itemUuid] || {}
      record[shareResponse.data.itemShare.uuid] = shareResponse.data.itemShare
      this.initiatedShares[itemUuid] = record
    }

    return this.buildUrlForSharedItem(appHost, shareResponse.data.itemShare.shareToken, keypair.privateKey)
  }

  public async getSharedItem(url: string): Promise<SharingServiceGetSharedItemReturn | ClientDisplayableError> {
    const params = this.decodeShareUrl(url)
    if (isClientDisplayableError(params)) {
      return params
    }

    const response = await this.sharingServer.getSharedItem(params.shareToken, params.thirdPartyApiHost)
    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { item, itemShare, fileValetToken } = response.data

    if (!item) {
      return ClientDisplayableError.FromString('Shared item not found')
    }

    const decryptedContentKey = this.operator.asymmetricAnonymousDecryptKey(
      itemShare.encryptedContentKey,
      itemShare.publicKey,
      params.privateKey,
    )

    const receivedPayloads = FilterDisallowedRemotePayloadsAndMap([item]).map((rawPayload) => {
      return CreatePayloadFromRawServerItem(rawPayload, PayloadSource.RemoteRetrieved)
    })

    const filteredPayload = receivedPayloads[0]

    if (!filteredPayload || isDeletedPayload(filteredPayload)) {
      return ClientDisplayableError.FromString('Shared item is deleted or client rejected')
    }

    const decryptedParameters = this.operator.generateDecryptedParametersForSharedItem(
      filteredPayload,
      decryptedContentKey,
    )

    if (isErrorDecryptingParameters(decryptedParameters)) {
      return ClientDisplayableError.FromString('Error decrypting shared item')
    }

    const decryptedPayload = new DecryptedPayload({
      ...filteredPayload.ejected(),
      ...decryptedParameters,
    })

    if (decryptedPayload.content_type === ContentType.File && !fileValetToken) {
      return ClientDisplayableError.FromString('File valet token is missing')
    }

    return {
      item: CreateDecryptedItemFromPayload(decryptedPayload),
      fileValetToken,
      publicKey: itemShare.publicKey,
    }
  }

  private buildUrlForSharedItem(appHost: string, shareToken: string, privateKey: string): string {
    const url = new URL(appHost)
    url.pathname = '/share'

    const params: SharingUrlParams = {
      t: shareToken,
      v: SharingUrlVersion,
    }

    const host = this.http.getHost()
    const isThirdPartyHost = !isUrlFirstParty(host)
    if (isThirdPartyHost) {
      params.h = host
    }

    url.searchParams.append('p', this.crypto.base64Encode(JSON.stringify(params)))

    url.hash = privateKey
    return url.toString()
  }

  private decodeShareUrl(urlString: string): DecodedSharingUrl | ClientDisplayableError {
    const url = new URL(urlString)
    const params = url.searchParams.get('p')
    if (!params) {
      return ClientDisplayableError.FromString('Invalid sharing URL')
    }

    const decodedParams = this.crypto.base64Decode(params)
    if (!decodedParams) {
      return ClientDisplayableError.FromString('Invalid sharing URL')
    }

    const parsedParams = JSON.parse(decodedParams)

    return {
      shareToken: parsedParams.t,
      thirdPartyApiHost: parsedParams.h,
      version: parsedParams.v,
      privateKey: url.hash.replace('#', ''),
    }
  }
}
