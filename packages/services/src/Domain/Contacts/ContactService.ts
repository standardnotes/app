import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  ContactServerHash,
  VaultInviteServerHash,
  VaultUserServerHash,
  isErrorResponse,
} from '@standardnotes/responses'
import { ContactServerInterface, HttpServiceInterface, ContactServer } from '@standardnotes/api'
import {
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
  FillItemContent,
  Predicate,
  TrustedContactMutator,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceEvent, ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedContactsData } from '../Event/SyncEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'

export class ContactService
  extends AbstractService<ContactServiceEvent>
  implements ContactServiceInterface, InternalEventHandlerInterface
{
  private contactServer: ContactServerInterface
  private serverContacts: Record<string, ContactServerHash> = {}

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private session: SessionsClientInterface,
    private crypto: PureCryptoInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SyncEvent.ReceivedContacts)

    this.contactServer = new ContactServer(this.http)
  }

  public isCollaborationEnabled(): boolean {
    return !!this.session.getPublicKey()
  }

  public async enableCollaboration(): Promise<void> {
    await this.session.updateAccountWithFirstTimeKeypair()
  }

  public async refreshAllContactsAfterPublicKeyChange(): Promise<void> {
    await this.contactServer.refreshAllContactsAfterPublicKeyChange()
  }

  public getCollaborationID(): string {
    const publicKey = this.session.getPublicKey()
    if (!publicKey) {
      throw new Error('Collaboration not enabled')
    }

    return this.buildCollaborationId({
      userUuid: this.session.getSureUser().uuid,
      userPublicKey: publicKey,
    })
  }

  private buildCollaborationId(params: { userUuid: string; userPublicKey: string }): string {
    const version = '1'
    const string = `${version}:${params.userUuid}:${params.userPublicKey}`
    return this.crypto.base64Encode(string)
  }

  public parseCollaborationID(collaborationID: string): { version: string; userUuid: string; userPublicKey: string } {
    const decoded = this.crypto.base64Decode(collaborationID)
    const [version, userUuid, userPublicKey] = decoded.split(':')
    return { version, userUuid, userPublicKey }
  }

  public getCollaborationIDFromInvite(invite: VaultInviteServerHash): string {
    return this.buildCollaborationId({
      userUuid: invite.inviter_uuid,
      userPublicKey: invite.inviter_public_key,
    })
  }

  public addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined> {
    const { userUuid, userPublicKey } = this.parseCollaborationID(collaborationID)
    return this.createTrustedContact({
      name: name ?? '',
      publicKey: userPublicKey,
      contactUuid: userUuid,
    })
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case SyncEvent.ReceivedContacts:
        return this.handleReceivedRemoteContactsEvent(event.payload as SyncEventReceivedContactsData)
    }
  }

  private async handleReceivedRemoteContactsEvent(contacts: ContactServerHash[]): Promise<void> {
    for (const contact of contacts) {
      this.serverContacts[contact.uuid] = contact
    }

    void this.notifyEvent(ContactServiceEvent.ReceivedContactRequests)
    void this.notifyEvent(ContactServiceEvent.ContactsChanged)
  }

  public getServerContacts(): ContactServerHash[] {
    return Object.values(this.serverContacts)
  }

  async trustServerContact(serverContact: ContactServerHash, name?: string): Promise<void> {
    const existingContact = this.findTrustedContact(serverContact.contact_uuid)
    if (existingContact) {
      await this.items.changeItem<TrustedContactMutator>(existingContact, (mutator) => {
        mutator.publicKey = serverContact.contact_public_key
        if (name) {
          mutator.name = name
        }
      })

      await this.sync.sync()
    } else {
      await this.createTrustedContact({
        name: name ?? '',
        publicKey: serverContact.contact_public_key,
        contactUuid: serverContact.contact_uuid,
      })
    }

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    delete this.serverContacts[serverContact.uuid]
  }

  async editTrustedContact(
    contact: TrustedContactInterface,
    params: { name: string; collaborationID: string },
  ): Promise<void> {
    await this.items.changeItem<TrustedContactMutator>(contact, (mutator) => {
      mutator.name = params.name
      if (params.collaborationID) {
        const { userPublicKey, userUuid } = this.parseCollaborationID(params.collaborationID)
        if (userUuid !== contact.contactUuid) {
          throw new Error("Collaboration ID's user uuid does not match contact UUID")
        }
        mutator.publicKey = userPublicKey
      }
    })

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()
  }

  async createTrustedContact(params: {
    name: string
    publicKey: string
    contactUuid: string
  }): Promise<TrustedContactInterface | undefined> {
    const createResponse = await this.contactServer.createContact({
      contactUuid: params.contactUuid,
      contactPublicKey: params.publicKey,
    })

    if (isErrorResponse(createResponse)) {
      console.error('Failed to create contact', createResponse)
      return undefined
    }

    const content: TrustedContactContentSpecialized = {
      name: params.name,
      publicKey: params.publicKey,
      contactUuid: params.contactUuid,
      serverUuid: createResponse.data.contact.uuid,
    }

    const contact = this.items.createItem<TrustedContactInterface>(
      ContentType.TrustedContact,
      FillItemContent<TrustedContactContent>(content),
      true,
    )

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()

    return contact
  }

  async deleteContact(contact: TrustedContactInterface): Promise<void> {
    await this.items.setItemToBeDeleted(contact)

    await this.contactServer.deleteContact({ uuid: contact.serverUuid })

    await this.sync.sync()

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)
  }

  getAllContacts(): TrustedContactInterface[] {
    return this.items.getItems(ContentType.TrustedContact)
  }

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined {
    return this.items.itemsMatchingPredicate<TrustedContactInterface>(
      ContentType.TrustedContact,
      new Predicate<TrustedContactInterface>('contactUuid', '=', userUuid),
    )[0]
  }

  findTrustedContactForServerUser(user: VaultUserServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(user.user_uuid)
  }

  findTrustedContactForInvite(invite: VaultInviteServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(invite.user_uuid)
  }

  getContactItem(serverUuid: string): TrustedContactInterface | undefined {
    return this.items.findItem(serverUuid)
  }

  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string {
    return this.buildCollaborationId({
      userUuid: contact.content.contactUuid,
      userPublicKey: contact.content.publicKey,
    })
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
