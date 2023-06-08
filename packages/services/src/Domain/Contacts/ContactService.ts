import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash } from '@standardnotes/responses'
import { HttpServiceInterface } from '@standardnotes/api'
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
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceEvent, ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { UserClientInterface } from '../User/UserClientInterface'
import { CollaborationIDData } from './CollaborationID'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

const Version1CollaborationId = '1'
const UnknownContactName = 'No name contact'

export class ContactService extends AbstractService<ContactServiceEvent> implements ContactServiceInterface {
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
  }

  public isCollaborationEnabled(): boolean {
    return !!this.session.getPublicKey()
  }

  public async enableCollaboration(): Promise<void> {
    await this.user.updateAccountWithFirstTimeKeyPair()
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
      userUuid: invite.sender_uuid,
      publicKey: invite.sender_public_key,
      signingPublicKey: signingPublicKey,
    })
  }

  public addTrustedContactFromCollaborationID(
    collaborationID: string,
    name?: string,
  ): Promise<TrustedContactInterface | undefined> {
    const { userUuid, publicKey, signingPublicKey } = this.parseCollaborationID(collaborationID)
    return this.createOrEditTrustedContact({
      name: name ?? '',
      contactUuid: userUuid,
      publicKey,
      signingPublicKey,
    })
  }

  async editTrustedContactFromCollaborationID(
    contact: TrustedContactInterface,
    params: { name: string; collaborationID: string },
  ): Promise<TrustedContactInterface> {
    const { publicKey, signingPublicKey, userUuid } = this.parseCollaborationID(params.collaborationID)
    if (userUuid !== contact.contactUuid) {
      throw new Error("Collaboration ID's user uuid does not match contact UUID")
    }

    const updatedContact = await this.items.changeItem<TrustedContactMutator, TrustedContactInterface>(
      contact,
      (mutator) => {
        mutator.name = params.name

        if (publicKey !== contact.publicKey.encryption || signingPublicKey !== contact.publicKey.signing) {
          mutator.addPublicKey({
            encryption: publicKey,
            signing: signingPublicKey,
          })
        }
      },
    )

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()

    return updatedContact
  }

  async updateTrustedContact(
    contact: TrustedContactInterface,
    params: { name: string; publicKey: string; signingPublicKey: string },
  ): Promise<TrustedContactInterface> {
    const updatedContact = await this.items.changeItem<TrustedContactMutator, TrustedContactInterface>(
      contact,
      (mutator) => {
        mutator.name = params.name

        if (
          params.publicKey !== contact.publicKey.encryption ||
          params.signingPublicKey !== contact.publicKey.signing
        ) {
          mutator.addPublicKey({
            encryption: params.publicKey,
            signing: params.signingPublicKey,
          })
        }
      },
    )

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()

    return updatedContact
  }

  async createOrUpdateTrustedContactFromContactShare(
    data: TrustedContactContentSpecialized,
  ): Promise<TrustedContactInterface> {
    let contact = this.findTrustedContact(data.contactUuid)
    if (contact) {
      contact = await this.items.changeItem<TrustedContactMutator, TrustedContactInterface>(contact, (mutator) => {
        mutator.name = data.name
        mutator.replacePublicKey(data.publicKey)
      })
    } else {
      contact = await this.items.createItem<TrustedContactInterface>(
        ContentType.TrustedContact,
        FillItemContent<TrustedContactContent>(data),
        true,
      )
    }

    void this.notifyEvent(ContactServiceEvent.ContactsChanged)

    await this.sync.sync()

    return contact
  }

  async createOrEditTrustedContact(params: {
    name?: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
  }): Promise<TrustedContactInterface | undefined> {
    const existingContact = this.findTrustedContact(params.contactUuid)
    if (existingContact) {
      await this.updateTrustedContact(existingContact, { ...params, name: params.name ?? existingContact.name })
      return existingContact
    }

    const content: TrustedContactContentSpecialized = {
      name: params.name ?? UnknownContactName,
      publicKey: TrustedContactPublicKey.FromJson({
        encryption: params.publicKey,
        signing: params.signingPublicKey,
        timestamp: new Date(),
      }),
      contactUuid: params.contactUuid,
    }

    const contact = await this.items.createItem<TrustedContactInterface>(
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
