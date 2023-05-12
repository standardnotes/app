import { ClientDisplayableError, SharedItemsUserShare } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { DecryptedItemInterface } from '@standardnotes/models'
import { ShareItemDuration } from './ShareItemDuration'

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
    uuid: string,
    duration: ShareItemDuration,
    appHost: string,
  ): Promise<SharingServiceShareItemReturn | ClientDisplayableError>

  getInitiatedShares(): Promise<SharedItemsUserShare[] | ClientDisplayableError>

  getSharedItem(url: string): Promise<SharingServiceGetSharedItemReturn | ClientDisplayableError>
}
