import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { UserKeyPairChangedEventData } from './../Session/UserKeyPairChangedEventData'
import { SessionEvent } from './../Session/SessionEvent'
import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash } from '@standardnotes/responses'
import { TrustedContactInterface, TrustedContactMutator, DecryptedItemInterface } from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceEvent, ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { UserClientInterface } from '../User/UserClientInterface'
import { CollaborationIDData, Version1CollaborationId } from './CollaborationID'
import { ValidateItemSigner } from './UseCase/ValidateItemSigner'
import { ItemSignatureValidationResult } from './UseCase/Types/ItemSignatureValidationResult'
import { FindContact } from './UseCase/FindContact'
import { SelfContactManager } from './SelfContactManager'
import { CreateOrEditContact } from './UseCase/CreateOrEditContact'
import { EditContact } from './UseCase/EditContact'
import { GetAllContacts } from './UseCase/GetAllContacts'
import { EncryptionProviderInterface } from '../Encryption/EncryptionProviderInterface'

export class ContactService
  extends AbstractService<ContactServiceEvent>
  implements ContactServiceInterface, InternalEventHandlerInterface
{
  constructor(
    private sync: SyncServiceInterface,
    private mutator: MutatorClientInterface,
    private session: SessionsClientInterface,
    private crypto: PureCryptoInterface,
    private user: UserClientInterface,
    private selfContactManager: SelfContactManager,
    private encryption: EncryptionProviderInterface,
    private _findContact: FindContact,
    private _getAllContacts: GetAllContacts,
    private _createOrEditContact: CreateOrEditContact,
    private _editContact: EditContact,
    private _validateItemSigner: ValidateItemSigner,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SessionEvent.UserKeyPairChanged)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.UserKeyPairChanged) {
      const data = event.payload as UserKeyPairChangedEventData

      await this.selfContactManager.updateWithNewPublicKeySet({
        encryption: data.current.encryption.publicKey,
        signing: data.current.signing.publicKey,
      })
    }
  }

  getSelfContact(): TrustedContactInterface | undefined {
    return this.selfContactManager.selfContact
  }

  public isCollaborationEnabled(): boolean {
    return !this.session.isUserMissingKeyPair()
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
    const publicKeySet = this.encryption.getSenderPublicKeySetFromAsymmetricallyEncryptedString(
      invite.encrypted_message,
    )
    return this.buildCollaborationId({
      version: Version1CollaborationId,
      userUuid: invite.sender_uuid,
      publicKey: publicKeySet.encryption,
      signingPublicKey: publicKeySet.signing,
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

    const updatedContact = await this.mutator.changeItem<TrustedContactMutator, TrustedContactInterface>(
      contact,
      (mutator) => {
        mutator.name = params.name

        if (publicKey !== contact.publicKeySet.encryption || signingPublicKey !== contact.publicKeySet.signing) {
          mutator.addPublicKey({
            encryption: publicKey,
            signing: signingPublicKey,
          })
        }
      },
    )

    await this.sync.sync()

    return updatedContact
  }

  async updateTrustedContact(
    contact: TrustedContactInterface,
    params: { name: string; publicKey: string; signingPublicKey: string },
  ): Promise<TrustedContactInterface> {
    const updatedContact = await this._editContact.execute(contact, params)

    return updatedContact
  }

  async createOrEditTrustedContact(params: {
    name?: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
    isMe?: boolean
  }): Promise<TrustedContactInterface | undefined> {
    const contact = await this._createOrEditContact.execute(params)
    return contact
  }

  async deleteContact(contact: TrustedContactInterface): Promise<void> {
    if (contact.isMe) {
      throw new Error('Cannot delete self')
    }

    await this.mutator.setItemToBeDeleted(contact)
    await this.sync.sync()
  }

  getAllContacts(): TrustedContactInterface[] {
    return this._getAllContacts.execute().getValue()
  }

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined {
    const result = this._findContact.execute({ userUuid })
    if (result.isFailed()) {
      return undefined
    }
    return result.getValue()
  }

  findTrustedContactForServerUser(user: SharedVaultUserServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(user.user_uuid)
  }

  findTrustedContactForInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined {
    return this.findTrustedContact(invite.sender_uuid)
  }

  getCollaborationIDForTrustedContact(contact: TrustedContactInterface): string {
    return this.buildCollaborationId({
      version: Version1CollaborationId,
      userUuid: contact.content.contactUuid,
      publicKey: contact.content.publicKeySet.encryption,
      signingPublicKey: contact.content.publicKeySet.signing,
    })
  }

  isItemAuthenticallySigned(item: DecryptedItemInterface): ItemSignatureValidationResult {
    return this._validateItemSigner.execute(item)
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.user as unknown) = undefined
    ;(this.selfContactManager as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this._findContact as unknown) = undefined
    ;(this._getAllContacts as unknown) = undefined
    ;(this._createOrEditContact as unknown) = undefined
    ;(this._editContact as unknown) = undefined
    ;(this._validateItemSigner as unknown) = undefined
  }
}
