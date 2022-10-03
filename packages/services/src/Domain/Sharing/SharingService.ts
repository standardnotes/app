import { SharingServiceInterface } from './SharingServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { ItemSharingInvite, EncryptedItemKeyShareInterface } from '@standardnotes/models'
import { Uuid } from '@standardnotes/common'
import { SharingServerInterface } from '@standardnotes/api'

export class SharingService extends AbstractService implements SharingServiceInterface {
  constructor(
    private sharingApiService: SharingServerInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  sendItemInvite(itemUuid: Uuid, recipientEmail: string): Promise<ItemSharingInvite> {}

  retrieveItemInvites(): Promise<ItemSharingInvite[]> {}

  acceptItemInvite(invite: ItemSharingInvite): Promise<void> {}

  initiateKeyShareForItemInvite(invite: ItemSharingInvite): Promise<EncryptedItemKeyShareInterface> {}

  downloadKeyShares(): Promise<EncryptedItemKeyShareInterface[]> {}

  sendWorkspaceInvite(recipientEmail: string): Promise<ItemSharingInvite> {}
}
