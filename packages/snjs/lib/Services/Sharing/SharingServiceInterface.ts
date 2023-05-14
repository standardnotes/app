import { ClientDisplayableError, SharedItemsUserShare } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { DecryptedItemInterface, SharedItemDuration, SharedItemPermission } from '@standardnotes/models'

export type SharingServiceShareItemReturn = string

export type SharingServiceGetSharedItemReturn = {
  item: DecryptedItemInterface
  fileValetToken?: string
  publicKey: string
}

export enum SharingServiceEvent {
  DidUpdateSharedItem = 'SharingServiceEventDidUpdateSharedItem',
}

export interface SharingServiceInterface extends AbstractService<SharingServiceEvent, any> {
  shareItem(
    itemUuid: string,
    duration: SharedItemDuration,
    permission: SharedItemPermission,
    appHost: string,
  ): Promise<SharingServiceShareItemReturn | ClientDisplayableError>

  getInitiatedShares(): Promise<SharedItemsUserShare[] | ClientDisplayableError>

  downloadSharedItem(url: string): Promise<SharingServiceGetSharedItemReturn | ClientDisplayableError>
}
