import { ErrorTag, isErrorResponse } from '@standardnotes/responses'
import { ProtocolOperator005, isErrorDecryptingParameters } from '@standardnotes/encryption'
import { AbstractService, InternalEventBusInterface, SyncEvent, SyncServiceInterface } from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedItemInterface,
  DecryptedPayload,
  FilterDisallowedRemotePayloadsAndMap,
  PayloadSource,
  ServerSyncPushContextualPayload,
  isDeletedPayload,
  isEncryptedPayload,
} from '@standardnotes/models'
import { CreatePayloadFromRawServerItem } from '../Sync/Account/Utilities'
import { SharingServiceEvent, SharingServiceInterface, SharingServiceShareItemReturn } from './SharingServiceInterface'
import { SharingApiInterface } from './SharingApiInterface'
import { SharedItemsUserShare } from './SharedItemsUserShare'

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
      throw new Error('Could not get share parameters')
    }

    if (!payload.contentKey) {
      throw new Error('Payload content key is missing')
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

  public async shareItem(uuid: string): Promise<SharingServiceShareItemReturn | undefined> {
    const payload = await this.sync.getItem(uuid)
    if (!payload || isEncryptedPayload(payload)) {
      return undefined
    }

    if (!payload.contentKey) {
      return undefined
    }

    const keypair = this.operator.generateKeyPair()

    const encryptedContentKey = this.operator.asymmetricAnonymousEncryptKey(payload.contentKey, keypair.publicKey)

    const shareResponse = await this.apiService.shareItem({
      itemUuid: uuid,
      encryptedContentKey: encryptedContentKey,
      publicKey: keypair.publicKey,
    })

    if (isErrorResponse(shareResponse)) {
      return undefined
    }

    if (shareResponse.data.itemShare.shareToken) {
      this.initiatedShares[uuid] = shareResponse.data.itemShare
    }

    return { shareToken: shareResponse.data.itemShare.shareToken, privateKey: keypair.privateKey }
  }

  public async getSharedItem(shareToken: string, privateKey: string): Promise<DecryptedItemInterface | undefined> {
    const response = await this.apiService.getSharedItem(shareToken)
    if (isErrorResponse(response)) {
      return undefined
    }
    const { item, itemShare } = response.data

    if (!item) {
      throw new Error('Shared item not found')
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
      throw new Error('Shared item is deleted or client rejected')
    }

    const decryptedParameters = this.operator.generateDecryptedParametersForSharedItem(
      filteredPayload,
      decryptedContentKey,
    )

    if (isErrorDecryptingParameters(decryptedParameters)) {
      throw new Error('Error decrypting shared item')
    }

    const decryptedPayload = new DecryptedPayload({
      ...filteredPayload.ejected(),
      ...decryptedParameters,
    })

    return CreateDecryptedItemFromPayload(decryptedPayload)
  }
}
