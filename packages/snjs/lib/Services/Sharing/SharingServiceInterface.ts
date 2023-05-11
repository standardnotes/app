import { ClientDisplayableError } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import { DecryptedItemInterface } from '@standardnotes/models'
import { SharedItemsUserShare } from './SharedItemsUserShare'
import { ShareItemDuration } from './ShareItemDuration'

export type SharingServiceShareItemReturn = {
  shareToken: string
  privateKey: string
}

export type SharingServiceGetSharedItemReturn = {
  item: DecryptedItemInterface
  fileValetToken?: string
}

export enum SharingServiceEvent {
  DidUpdateSharedItem = 'SharingServiceEventDidUpdateSharedItem',
}

export interface SharingServiceInterface extends AbstractService<SharingServiceEvent, any> {
  shareItem(uuid: string, duration: ShareItemDuration): Promise<SharingServiceShareItemReturn | ClientDisplayableError>

  getInitiatedShares(): Promise<SharedItemsUserShare[] | ClientDisplayableError>

  getSharedItem(
    shareToken: string,
    privateKey: string,
  ): Promise<SharingServiceGetSharedItemReturn | ClientDisplayableError>
}
