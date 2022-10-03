/* istanbul ignore file */

import { Uuid } from '@standardnotes/common'
import { ItemSharingInvite, EncryptedItemKeyShareInterface } from '@standardnotes/models'

export interface SharingServiceInterface {
  sendItemInvite(itemUuid: Uuid, recipientEmail: string): Promise<ItemSharingInvite>
  retrieveItemInvites(): Promise<ItemSharingInvite[]>
  acceptItemInvite(invite: ItemSharingInvite): Promise<void>
  initiateKeyShareForItemInvite(invite: ItemSharingInvite): Promise<EncryptedItemKeyShareInterface>
  downloadKeyShares(): Promise<EncryptedItemKeyShareInterface[]>
  sendWorkspaceInvite(recipientEmail: string): Promise<ItemSharingInvite>
}
