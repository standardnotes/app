import { AbstractService } from '@standardnotes/services'
import { DecryptedItemInterface } from '@standardnotes/models'
import { SharedItemsUserShare } from './SharedItemsUserShare'

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
  shareItem(uuid: string): Promise<SharingServiceShareItemReturn | undefined>

  getInitiatedShares(): Promise<SharedItemsUserShare[]>

  getSharedItem(shareToken: string, privateKey: string): Promise<SharingServiceGetSharedItemReturn | undefined>
}
