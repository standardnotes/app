import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { ApplicationStage } from './../Application/ApplicationStage'
import { SingletonManagerInterface } from './../Singleton/SingletonManagerInterface'
import { UserKeyPairChangedEventData } from './../Session/UserKeyPairChangedEventData'
import { SessionEvent } from './../Session/SessionEvent'
import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SharedVaultInviteServerHash, SharedVaultUserServerHash } from '@standardnotes/responses'
import {
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
  FillItemContent,
  TrustedContactMutator,
  DecryptedItemInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceEvent, ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { UserClientInterface } from '../User/UserClientInterface'
import { CollaborationIDData, Version1CollaborationId } from './CollaborationID'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ValidateItemSignerUseCase } from './UseCase/ValidateItemSigner'
import { ValidateItemSignerResult } from './UseCase/ValidateItemSignerResult'
import { FindTrustedContactUseCase } from './UseCase/FindTrustedContact'
import { SelfContactManager } from './Managers/SelfContactManager'
import { CreateOrEditTrustedContactUseCase } from './UseCase/CreateOrEditTrustedContact'
import { UpdateTrustedContactUseCase } from './UseCase/UpdateTrustedContact'
import { ContentType } from '@standardnotes/domain-core'

export class ContactService
  extends AbstractService<ContactServiceEvent>
  implements ContactServiceInterface, InternalEventHandlerInterface
{
  private selfContactManager: SelfContactManager

  constructor(
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private session: SessionsClientInterface,
    private crypto: PureCryptoInterface,
    private user: UserClientInterface,
    private encryption: EncryptionProviderInterface,
    singletons: SingletonManagerInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    this.selfContactManager = new SelfContactManager(sync, items, mutator, session, singletons)

    eventBus.addEventHandler(this, SessionEvent.UserKeyPairChanged)
  }

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    await super.handleApplicationStage(stage)
    await this.selfContactManager.handleApplicationStage(stage)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.UserKeyPairChanged) {
      const data = event.payload as UserKeyPairChangedEventData

      await this.selfContactManager.updateWithNewPublicKeySet({
        encryption: data.newKeyPair.publicKey,
        signing: data.newSigningKeyPair.publicKey,
      })
    }
  }

  private get userUuid(): string {
    return this.session.getSureUser().uuid
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
    const usecase = new UpdateTrustedContactUseCase(this.mutator, this.sync)
    const updatedContact = await usecase.execute(contact, params)

    return updatedContact
  }

  async createOrUpdateTrustedContactFromContactShare(
    data: TrustedContactContentSpecialized,
  ): Promise<TrustedContactInterface> {
    if (data.contactUuid === this.userUuid) {
      throw new Error('Cannot receive self from contact share')
    }

    let contact = this.findTrustedContact(data.contactUuid)
    if (contact) {
      contact = await this.mutator.changeItem<TrustedContactMutator, TrustedContactInterface>(contact, (mutator) => {
        mutator.name = data.name
        mutator.replacePublicKeySet(data.publicKeySet)
      })
    } else {
      contact = await this.mutator.createItem<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        FillItemContent<TrustedContactContent>(data),
        true,
      )
    }

    await this.sync.sync()

    return contact
  }

  async createOrEditTrustedContact(params: {
    name?: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
    isMe?: boolean
  }): Promise<TrustedContactInterface | undefined> {
    const usecase = new CreateOrEditTrustedContactUseCase(this.items, this.mutator, this.sync)
    const contact = await usecase.execute(params)
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
    return this.items.getItems(ContentType.TYPES.TrustedContact)
  }

  findTrustedContact(userUuid: string): TrustedContactInterface | undefined {
    const usecase = new FindTrustedContactUseCase(this.items)
    return usecase.execute({ userUuid })
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

  isItemAuthenticallySigned(item: DecryptedItemInterface): ValidateItemSignerResult {
    const usecase = new ValidateItemSignerUseCase(this.items)
    return usecase.execute(item)
  }

  override deinit(): void {
    super.deinit()
    this.selfContactManager.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.selfContactManager as unknown) = undefined
  }
}
