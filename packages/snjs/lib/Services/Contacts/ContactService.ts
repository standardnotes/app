import { isErrorResponse } from '@standardnotes/responses'
import { ContactServerInterface, HttpServiceInterface, ContactServer } from '@standardnotes/api'
import {
  AbstractService,
  ContactServiceInterface,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  SyncEvent,
  SyncServiceInterface,
} from '@standardnotes/services'
import {
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
  FillItemContent,
  Predicate,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'

export class ContactService extends AbstractService implements ContactServiceInterface, InternalEventHandlerInterface {
  private contactServer: ContactServerInterface

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SyncEvent.ReceivedContacts)

    this.contactServer = new ContactServer(this.http)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case SyncEvent.ReceivedContacts:
        return this.handleReceivedRemoteContactsEvent()
    }
  }

  private async handleReceivedRemoteContactsEvent(): Promise<void> {
    // TODO: Prompt user whether they want to trust the new credentials
  }

  async createTrustedContact(params: {
    name: string
    publicKey: string
    userUuid: string
  }): Promise<TrustedContactInterface | undefined> {
    const createResponse = await this.contactServer.createContact({
      contactUuid: params.userUuid,
      contactPublicKey: params.publicKey,
    })

    if (isErrorResponse(createResponse)) {
      return undefined
    }

    const content: TrustedContactContentSpecialized = {
      name: params.name,
      contactPublicKey: params.publicKey,
      contactUserUuid: params.userUuid,
      contactItemUuid: createResponse.data.contact.uuid,
    }

    const contact = this.items.createItem<TrustedContactInterface>(
      ContentType.TrustedContact,
      FillItemContent<TrustedContactContent>(content),
      true,
    )

    await this.sync.sync()

    return contact
  }

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined {
    return this.items.itemsMatchingPredicate<TrustedContactInterface>(
      ContentType.TrustedContact,
      new Predicate<TrustedContactInterface>('contactUserUuid', '=', userUuid),
    )[0]
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
