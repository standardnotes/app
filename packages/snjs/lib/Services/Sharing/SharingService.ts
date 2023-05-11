import { ClientDisplayableError, ErrorTag, isErrorResponse } from '@standardnotes/responses'
import { ProtocolOperator005, isErrorDecryptingParameters } from '@standardnotes/encryption'
import { AbstractService, InternalEventBusInterface, SyncEvent, SyncServiceInterface } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  FileContent,
  FilterDisallowedRemotePayloadsAndMap,
  PayloadSource,
  ServerSyncPushContextualPayload,
  isDeletedPayload,
  isEncryptedPayload,
} from '@standardnotes/models'
import { CreatePayloadFromRawServerItem } from '../Sync/Account/Utilities'
import {
  SharingServiceEvent,
  SharingServiceGetSharedItemReturn,
  SharingServiceInterface,
  SharingServiceShareItemReturn,
} from './SharingServiceInterface'
import { SharingApiInterface } from './SharingApiInterface'
import { SharedItemsUserShare } from './SharedItemsUserShare'
import { ContentType } from '@standardnotes/common'
import { ShareItemDuration } from './ShareItemDuration'

export class SharingService extends AbstractService<SharingServiceEvent, any> implements SharingServiceInterface {
  private syncObserver: () => void
  private initiatedShares: Record<string, SharedItemsUserShare> = {}
  private operator: ProtocolOperator005

  constructor(
    private apiService: SharingApiInterface,
    private sync: SyncServiceInterface,
    crypto: PureCryptoInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.syncObserver = sync.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.SingleRoundTripSyncCompleted && data) {
        const eventData = data as { uploadedPayloads: ServerSyncPushContextualPayload[] }
        const { uploadedPayloads } = eventData
        if (uploadedPayloads) {
          for (const payload of uploadedPayloads) {
            const shareData = this.initiatedShares[payload.uuid]
            if (shareData) {
              void this.updateSharedItem(payload.uuid, shareData.shareToken, shareData.publicKey)
            }
          }
        }
      }
    })

    this.operator = new ProtocolOperator005(crypto)
    void this.downloadUserShares()
  }

  override deinit(): void {
    super.deinit()
    this.syncObserver()
  }

  async downloadUserShares(): Promise<void> {
    const shares = await this.getInitiatedShares()
    for (const share of shares) {
      this.initiatedShares[share.itemUuid] = share
    }
  }

  async getInitiatedShares(): Promise<SharedItemsUserShare[]> {
    const response = await this.apiService.getInitiatedShares()
    if (isErrorResponse(response)) {
      return []
    }
    return response.data.itemShares
  }

  private async updateSharedItem(uuid: string, shareToken: string, publicKey: string) {
    const payload = await this.sync.getItem(uuid)
    if (!payload || isEncryptedPayload(payload)) {
      return ClientDisplayableError.FromString('Could not get share parameters')
    }

    if (!payload.contentKey) {
      return ClientDisplayableError.FromString('Payload content key is missing')
    }

    const encryptedContentKey = this.operator.asymmetricAnonymousEncryptKey(payload.contentKey, publicKey)

    const shareResponse = await this.apiService.updateSharedItem({
      shareToken,
      encryptedContentKey: encryptedContentKey,
    })

    if (isErrorResponse(shareResponse)) {
      if (shareResponse.data.error.tag === ErrorTag.ExpiredItemShare) {
        delete this.initiatedShares[uuid]
      }
    }

    void this.notifyEvent(SharingServiceEvent.DidUpdateSharedItem, { uuid })

    return shareResponse
  }

  public async shareItem(
    uuid: string,
    duration: ShareItemDuration,
  ): Promise<SharingServiceShareItemReturn | ClientDisplayableError> {
    const payload = await this.sync.getItem(uuid)
    if (!payload || isEncryptedPayload(payload)) {
      return ClientDisplayableError.FromString('Could not get item to share')
    }

    if (!payload.contentKey) {
      return ClientDisplayableError.FromString('Payload content key is missing')
    }

    const keypair = this.operator.generateKeyPair()

    const encryptedContentKey = this.operator.asymmetricAnonymousEncryptKey(payload.contentKey, keypair.publicKey)

    const shareResponse = await this.apiService.shareItem({
      contentType: payload.content_type,
      itemUuid: uuid,
      encryptedContentKey: encryptedContentKey,
      publicKey: keypair.publicKey,
      duration: duration,
      fileRemoteIdentifier:
        payload.content_type === ContentType.File ? (payload.content as FileContent).remoteIdentifier : undefined,
    })

    if (isErrorResponse(shareResponse)) {
      return ClientDisplayableError.FromError(shareResponse.data.error)
    }

    if (shareResponse.data.itemShare.shareToken) {
      this.initiatedShares[uuid] = shareResponse.data.itemShare
    }

    return { shareToken: shareResponse.data.itemShare.shareToken, privateKey: keypair.privateKey }
  }

  public async getSharedItem(
    shareToken: string,
    privateKey: string,
  ): Promise<SharingServiceGetSharedItemReturn | ClientDisplayableError> {
    const response = await this.apiService.getSharedItem(shareToken)
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
      privateKey,
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
    }
  }
}
