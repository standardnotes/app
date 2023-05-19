import {
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  ContactServiceInterface,
} from '@standardnotes/services'
import { ContactContent, ContactContentSpecialized, ContactInterface, FillItemContent } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'

export class ContactService extends AbstractService implements ContactServiceInterface {
  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  async createContact(params: {
    name: string
    publicKey: string
    userUuid: string
    trusted: boolean
  }): Promise<ContactInterface> {
    const content: ContactContentSpecialized = {
      name: params.name,
      publicKey: params.publicKey,
      userUuid: params.userUuid,
    }

    const contact = this.items.createItem<ContactInterface>(
      ContentType.Contact,
      FillItemContent<ContactContent>(content),
      true,
    )

    await this.sync.sync()

    return contact
  }

  findContact(userUuid: string): ContactInterface | undefined {
    return this.items.getItems<ContactInterface>(ContentType.Contact).filter((item) => item.userUuid === userUuid)[0]
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
