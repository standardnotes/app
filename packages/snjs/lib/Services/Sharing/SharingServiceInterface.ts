import { ClientDisplayableError } from '@standardnotes/responses'
import { AbstractService } from '@standardnotes/services'
import {
  ShareGroupInterface,
  ShareGroupUserInterface,
  ShareGroupItemInterface,
  ShareGroupPermission,
} from '@standardnotes/api'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'

export enum SharingServiceEvent {}

export interface SharingServiceInterface extends AbstractService<SharingServiceEvent> {
  createShareGroup(): Promise<ShareGroupInterface | ClientDisplayableError>

  addContactToShareGroup(
    group: ShareGroupInterface,
    contact: Contact,
    permissions: ShareGroupPermission,
  ): Promise<ShareGroupUserInterface | ClientDisplayableError>

  addItemToShareGroup(
    group: ShareGroupInterface,
    item: DecryptedItemInterface,
  ): Promise<ShareGroupItemInterface | ClientDisplayableError>
}
