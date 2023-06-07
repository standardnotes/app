import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  ContactServerHash,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
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
  TrustedContactPublicKey,
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
import { UserClientInterface } from '../User/UserClientInterface'
import { CollaborationIDData } from './CollaborationID'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

const Version1CollaborationId = '1'

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
    private user: UserClientInterface,
    private encryption: EncryptionProviderInterface,
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
    await this.user.updateAccountWithFirstTimeKeyPair()
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
      version: Version1CollaborationId,
      userUuid: this.session.getSureUser().uuid,
      publicKey,
      signingPublicKey: this.session.getSigningPublicKey(),
    })
  }

  private buildCollaborationId(params: CollaborationIDData): string {
    const string = `${params.version}:${params.userUuid}:${params.publicKey}:${params.signingPublicKey}`
    return this.crypto.base64Encode(string)
  }

  public parseCollaborationID(collaborationID: string): CollaborationIDData {
    const decoded = this.crypto.base64Decode(collaborationID)
    const [version, userUuid, publicKey, signingPublicKey] = decoded.split(':')
    return { version, userUuid, publicKey, signingPublicKey }
  }

  public getCollaborationIDFromInvite(invite: SharedVaultInviteServerHash): string {
    const signingPublicKey = this.encryption.getSignerPublicKeyFromAsymmetricallyEncryptedString(
      invite.encrypted_message,
    )
    return this.buildCollaborationId({
      version: Version1CollaborationId,
      userUuid: invite.inviter_uuid,
      publicKey: invite.sender_public_key,
      signingPublicKey: signingPublicKey,
    })
  }

  public addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined> {
    const { userUuid, publicKey, signingPublicKey } = this.parseCollaborationID(collaborationID)
    return this.createTrustedContact({
      name: name ?? '',
      contactUuid: userUuid,
      publicKey,
      signingPublicKey,
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
        mutator.addPublicKey({
          encryption: serverContact.contact_public_key,
          signing: serverContact.contact_signing_public_key,
        })
        if (name) {
          mutator.name = name
        }
      })

      await this.sync.sync()
    } else {
      await this.createTrustedContact({
        name: name ?? '',
        contactUuid: serverContact.contact_uuid,
        publicKey: serverContact.contact_public_key,
        signingPublicKey: serverContact.contact_signing_public_key,
      })
    }

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    delete this.serverContacts[serverContact.uuid]
  }

  async editTrustedContact(
    contact: TrustedContactInterface,
    params: { name: string; collaborationID: string },
  ): Promise<void> {
    const { publicKey, signingPublicKey, userUuid } = this.parseCollaborationID(params.collaborationID)
    if (userUuid !== contact.contactUuid) {
      throw new Error("Collaboration ID's user uuid does not match contact UUID")
    }

    await this.items.changeItem<TrustedContactMutator>(contact, (mutator) => {
      mutator.name = params.name

      if (publicKey !== contact.publicKey.encryption || signingPublicKey !== contact.publicKey.signing) {
        mutator.addPublicKey({
          encryption: publicKey,
          signing: signingPublicKey,
        })
      }
    })

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()
  }

  async createTrustedContact(params: {
    name: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
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
      publicKey: TrustedContactPublicKey.FromJson({
        encryption: params.publicKey,
        signing: params.signingPublicKey,
        timestamp: new Date(),
      }),
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

  findTrustedContactForServerUser(user: SharedVaultUserServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(user.user_uuid)
  }

  findTrustedContactForInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(invite.user_uuid)
  }

  getContactItem(serverUuid: string): TrustedContactInterface | undefined {
    return this.items.findItem(serverUuid)
  }

  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string {
    return this.buildCollaborationId({
      version: Version1CollaborationId,
      userUuid: contact.content.contactUuid,
      publicKey: contact.content.publicKey.encryption,
      signingPublicKey: contact.content.publicKey.signing,
    })
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
  }
}
