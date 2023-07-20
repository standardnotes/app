import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import { StorageServiceInterface } from './../Storage/StorageServiceInterface'
import { InviteContactToSharedVaultUseCase } from './UseCase/InviteContactToSharedVault'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultUserServerHash,
  isClientDisplayableError,
  SharedVaultPermission,
  UserEventType,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  SharedVaultServerInterface,
  SharedVaultUsersServerInterface,
  SharedVaultInvitesServerInterface,
  SharedVaultUsersServer,
  SharedVaultInvitesServer,
  SharedVaultServer,
  AsymmetricMessageServerInterface,
  AsymmetricMessageServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  PayloadEmitSource,
  TrustedContactInterface,
  SharedVaultListingInterface,
  VaultListingInterface,
  AsymmetricMessageSharedVaultInvite,
  KeySystemRootKeyStorageMode,
  ContactPublicKeySetInterface,
} from '@standardnotes/models'
import { SharedVaultServiceInterface } from './SharedVaultServiceInterface'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { GetSharedVaultUsersUseCase } from './UseCase/GetSharedVaultUsers'
import { RemoveVaultMemberUseCase } from './UseCase/RemoveSharedVaultMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedSharedVaultInvitesData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { FilesClientInterface } from '@standardnotes/files'
import { LeaveVaultUseCase } from './UseCase/LeaveSharedVault'
import { VaultServiceInterface } from '../Vaults/VaultServiceInterface'
import { UserEventServiceEvent, UserEventServiceEventPayload } from '../UserEvent/UserEventServiceEvent'
import { DeleteExternalSharedVaultUseCase } from './UseCase/DeleteExternalSharedVault'
import { DeleteSharedVaultUseCase } from './UseCase/DeleteSharedVault'
import { VaultServiceEvent, VaultServiceEventPayload } from '../Vaults/VaultServiceEvent'
import { AcceptTrustedSharedVaultInvite } from './UseCase/AcceptTrustedSharedVaultInvite'
import { GetAsymmetricMessageTrustedPayload } from '../AsymmetricMessage/UseCase/GetAsymmetricMessageTrustedPayload'
import { PendingSharedVaultInviteRecord } from './PendingSharedVaultInviteRecord'
import { GetAsymmetricMessageUntrustedPayload } from '../AsymmetricMessage/UseCase/GetAsymmetricMessageUntrustedPayload'
import { ShareContactWithAllMembersOfSharedVaultUseCase } from './UseCase/ShareContactWithAllMembersOfSharedVault'
import { GetSharedVaultTrustedContacts } from './UseCase/GetSharedVaultTrustedContacts'
import { NotifySharedVaultUsersOfRootKeyRotationUseCase } from './UseCase/NotifySharedVaultUsersOfRootKeyRotation'
import { CreateSharedVaultUseCase } from './UseCase/CreateSharedVault'
import { SendSharedVaultMetadataChangedMessageToAll } from './UseCase/SendSharedVaultMetadataChangedMessageToAll'
import { ConvertToSharedVaultUseCase } from './UseCase/ConvertToSharedVault'
import { GetVaultUseCase } from '../Vaults/UseCase/GetVault'
import { ContentType, Result } from '@standardnotes/domain-core'
import { RevokePublicKeyUseCase } from '../Contacts/UseCase/RevokePublicKey'
import { EncryptAsymmetricMessagePayload } from '../Encryption/UseCase/Asymmetric/EncryptAsymmetricMessagePayload'
import { SendAsymmetricMessageUseCase } from '../AsymmetricMessage/UseCase/SendAsymmetricMessageUseCase'
import { GetOutboundAsymmetricMessages } from '../AsymmetricMessage/UseCase/GetOutboundAsymmetricMessages'
import { GetAsymmetricStringAdditionalData } from '../Encryption/UseCase/Asymmetric/GetAsymmetricStringAdditionalData'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  private server: SharedVaultServerInterface
  private usersServer: SharedVaultUsersServerInterface
  private invitesServer: SharedVaultInvitesServerInterface
  private messageServer: AsymmetricMessageServerInterface

  private pendingInvites: Record<string, PendingSharedVaultInviteRecord> = {}

  constructor(
    http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private files: FilesClientInterface,
    private vaults: VaultServiceInterface,
    private storage: StorageServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    eventBus.addEventHandler(this, SessionEvent.UserKeyPairChanged)
    eventBus.addEventHandler(this, UserEventServiceEvent.UserEventReceived)
    eventBus.addEventHandler(this, VaultServiceEvent.VaultRootKeyRotated)

    this.server = new SharedVaultServer(http)
    this.usersServer = new SharedVaultUsersServer(http)
    this.invitesServer = new SharedVaultInvitesServer(http)
    this.messageServer = new AsymmetricMessageServer(http)

    this.eventDisposers.push(
      sync.addEventObserver(async (event, data) => {
        if (event === SyncEvent.ReceivedSharedVaultInvites) {
          void this.processInboundInvites(data as SyncEventReceivedSharedVaultInvitesData)
        } else if (event === SyncEvent.ReceivedRemoteSharedVaults) {
          void this.notifyCollaborationStatusChanged()
        }
      }),
    )

    this.eventDisposers.push(
      items.addObserver<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        async ({ changed, inserted, source }) => {
          await this.reprocessCachedInvitesTrustStatusAfterTrustedContactsChange()

          if (source === PayloadEmitSource.LocalChanged && inserted.length > 0) {
            void this.handleCreationOfNewTrustedContacts(inserted)
          }
          if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
            void this.handleTrustedContactsChange(changed)
          }
        },
      ),
    )

    this.eventDisposers.push(
      items.addObserver<VaultListingInterface>(ContentType.TYPES.VaultListing, ({ changed, source }) => {
        if (source === PayloadEmitSource.LocalChanged && changed.length > 0) {
          void this.handleVaultListingsChange(changed)
        }
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.UserKeyPairChanged) {
      void this.invitesServer.deleteAllInboundInvites()
    } else if (event.type === UserEventServiceEvent.UserEventReceived) {
      await this.handleUserEvent(event.payload as UserEventServiceEventPayload)
    } else if (event.type === VaultServiceEvent.VaultRootKeyRotated) {
      const payload = event.payload as VaultServiceEventPayload[VaultServiceEvent.VaultRootKeyRotated]
      await this.handleVaultRootKeyRotatedEvent(payload.vault)
    }
  }

  private async handleUserEvent(event: UserEventServiceEventPayload): Promise<void> {
    if (event.eventPayload.eventType === UserEventType.RemovedFromSharedVault) {
      const vault = new GetVaultUseCase(this.items).execute({ sharedVaultUuid: event.eventPayload.sharedVaultUuid })
      if (vault) {
        const useCase = new DeleteExternalSharedVaultUseCase(
          this.items,
          this.mutator,
          this.encryption,
          this.storage,
          this.sync,
        )
        await useCase.execute(vault)
      }
    } else if (event.eventPayload.eventType === UserEventType.SharedVaultItemRemoved) {
      const item = this.items.findItem(event.eventPayload.itemUuid)
      if (item) {
        this.items.removeItemsLocally([item])
      }
    }
  }

  private async handleVaultRootKeyRotatedEvent(vault: VaultListingInterface): Promise<void> {
    if (!vault.isSharedVaultListing()) {
      return
    }

    if (!this.isCurrentUserSharedVaultOwner(vault)) {
      return
    }

    const usecase = new NotifySharedVaultUsersOfRootKeyRotationUseCase(
      this.usersServer,
      this.invitesServer,
      this.messageServer,
      this.encryption,
      this.contacts,
    )

    await usecase.execute({ sharedVault: vault, userUuid: this.session.getSureUser().uuid })
  }

  async createSharedVault(dto: {
    name: string
    description?: string
    userInputtedPassword: string | undefined
    storagePreference?: KeySystemRootKeyStorageMode
  }): Promise<VaultListingInterface | ClientDisplayableError> {
    const usecase = new CreateSharedVaultUseCase(
      this.encryption,
      this.items,
      this.mutator,
      this.sync,
      this.files,
      this.server,
    )

    return usecase.execute({
      vaultName: dto.name,
      vaultDescription: dto.description,
      userInputtedPassword: dto.userInputtedPassword,
      storagePreference: dto.storagePreference ?? KeySystemRootKeyStorageMode.Synced,
    })
  }

  async convertVaultToSharedVault(
    vault: VaultListingInterface,
  ): Promise<SharedVaultListingInterface | ClientDisplayableError> {
    const usecase = new ConvertToSharedVaultUseCase(this.items, this.mutator, this.sync, this.files, this.server)

    return usecase.execute({ vault })
  }

  public getCachedPendingInviteRecords(): PendingSharedVaultInviteRecord[] {
    return Object.values(this.pendingInvites)
  }

  private getAllSharedVaults(): SharedVaultListingInterface[] {
    const vaults = this.vaults.getVaults().filter((vault) => vault.isSharedVaultListing())
    return vaults as SharedVaultListingInterface[]
  }

  private findSharedVault(sharedVaultUuid: string): SharedVaultListingInterface | undefined {
    return this.getAllSharedVaults().find((vault) => vault.sharing.sharedVaultUuid === sharedVaultUuid)
  }

  public isCurrentUserSharedVaultAdmin(sharedVault: SharedVaultListingInterface): boolean {
    if (!sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }
    return sharedVault.sharing.ownerUserUuid === this.session.userUuid
  }

  public isCurrentUserSharedVaultOwner(sharedVault: SharedVaultListingInterface): boolean {
    if (!sharedVault.sharing.ownerUserUuid) {
      throw new Error(`Shared vault ${sharedVault.sharing.sharedVaultUuid} does not have an owner user uuid`)
    }
    return sharedVault.sharing.ownerUserUuid === this.session.userUuid
  }

  public isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean {
    const vault = this.findSharedVault(user.shared_vault_uuid)
    return vault != undefined && vault.sharing.ownerUserUuid === user.user_uuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  private async handleTrustedContactsChange(contacts: TrustedContactInterface[]): Promise<void> {
    for (const contact of contacts) {
      if (contact.isMe) {
        continue
      }

      await this.shareContactWithUserAdministeredSharedVaults(contact)
    }
  }

  private async handleVaultListingsChange(vaults: VaultListingInterface[]): Promise<void> {
    for (const vault of vaults) {
      if (!vault.isSharedVaultListing()) {
        continue
      }

      const usecase = new SendSharedVaultMetadataChangedMessageToAll(
        this.encryption,
        this.contacts,
        this.usersServer,
        this.messageServer,
      )

      await usecase.execute({
        vault,
        senderUuid: this.session.getSureUser().uuid,
        senderEncryptionKeyPair: this.encryption.getKeyPair(),
        senderSigningKeyPair: this.encryption.getSigningKeyPair(),
      })
    }
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]> {
    const response = await this.invitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(
    sharedVault?: SharedVaultListingInterface,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError> {
    const response = await this.invitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (sharedVault) {
      return response.data.invites.filter((invite) => invite.shared_vault_uuid === sharedVault.sharing.sharedVaultUuid)
    }

    return response.data.invites
  }

  public async deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.invitesServer.deleteInvite({
      sharedVaultUuid: invite.shared_vault_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  public async deleteSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    const useCase = new DeleteSharedVaultUseCase(this.server, this.items, this.mutator, this.sync, this.encryption)
    return useCase.execute({ sharedVault })
  }

  private async reprocessCachedInvitesTrustStatusAfterTrustedContactsChange(): Promise<void> {
    const cachedInvites = this.getCachedPendingInviteRecords().map((record) => record.invite)

    await this.processInboundInvites(cachedInvites)
  }

  private async processInboundInvites(invites: SharedVaultInviteServerHash[]): Promise<void> {
    if (invites.length === 0) {
      return
    }

    for (const invite of invites) {
      const trustedMessageUseCase = new GetAsymmetricMessageTrustedPayload<AsymmetricMessageSharedVaultInvite>(
        this.encryption,
        this.contacts,
      )

      const trustedMessage = trustedMessageUseCase.execute({
        message: invite,
        privateKey: this.encryption.getKeyPair().privateKey,
      })

      if (trustedMessage) {
        this.pendingInvites[invite.uuid] = {
          invite,
          message: trustedMessage,
          trusted: true,
        }

        continue
      }

      const untrustedMessageUseCase = new GetAsymmetricMessageUntrustedPayload<AsymmetricMessageSharedVaultInvite>(
        this.encryption,
      )

      const untrustedMessage = untrustedMessageUseCase.execute({
        message: invite,
        privateKey: this.encryption.getKeyPair().privateKey,
      })

      if (untrustedMessage) {
        this.pendingInvites[invite.uuid] = {
          invite,
          message: untrustedMessage,
          trusted: false,
        }
      }
    }

    await this.notifyCollaborationStatusChanged()
  }

  private async notifyCollaborationStatusChanged(): Promise<void> {
    await this.notifyEventSync(SharedVaultServiceEvent.SharedVaultStatusChanged)
  }

  async acceptPendingSharedVaultInvite(pendingInvite: PendingSharedVaultInviteRecord): Promise<void> {
    if (!pendingInvite.trusted) {
      throw new Error('Cannot accept untrusted invite')
    }

    const useCase = new AcceptTrustedSharedVaultInvite(this.invitesServer, this.mutator, this.sync, this.contacts)
    await useCase.execute({ invite: pendingInvite.invite, message: pendingInvite.message })

    delete this.pendingInvites[pendingInvite.invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsAfterInviteAccept()

    await this.sync.syncSharedVaultsFromScratch([pendingInvite.invite.shared_vault_uuid])
  }

  private async decryptErroredItemsAfterInviteAccept(): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  public async getInvitableContactsForSharedVault(
    sharedVault: SharedVaultListingInterface,
  ): Promise<TrustedContactInterface[]> {
    const users = await this.getSharedVaultUsers(sharedVault)
    if (!users) {
      return []
    }

    const contacts = this.contacts.getAllContacts()
    return contacts.filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  private async getSharedVaultContacts(sharedVault: SharedVaultListingInterface): Promise<TrustedContactInterface[]> {
    const usecase = new GetSharedVaultTrustedContacts(this.contacts, this.usersServer)
    const contacts = await usecase.execute(sharedVault)
    if (!contacts) {
      return []
    }

    return contacts
  }

  async inviteContactToSharedVault(
    sharedVault: SharedVaultListingInterface,
    contact: TrustedContactInterface,
    permissions: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const sharedVaultContacts = await this.getSharedVaultContacts(sharedVault)

    const useCase = new InviteContactToSharedVaultUseCase(this.encryption, this.invitesServer)

    const result = await useCase.execute({
      senderKeyPair: this.encryption.getKeyPair(),
      senderSigningKeyPair: this.encryption.getSigningKeyPair(),
      sharedVault,
      recipient: contact,
      sharedVaultContacts,
      permissions,
    })

    void this.notifyCollaborationStatusChanged()

    await this.sync.sync()

    return result
  }

  async removeUserFromSharedVault(
    sharedVault: SharedVaultListingInterface,
    userUuid: string,
  ): Promise<ClientDisplayableError | void> {
    if (!this.isCurrentUserSharedVaultAdmin(sharedVault)) {
      throw new Error('Only vault admins can remove users')
    }

    if (this.vaults.isVaultLocked(sharedVault)) {
      throw new Error('Cannot remove user from locked vault')
    }

    const useCase = new RemoveVaultMemberUseCase(this.usersServer)
    const result = await useCase.execute({ sharedVaultUuid: sharedVault.sharing.sharedVaultUuid, userUuid })
    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    await this.vaults.rotateVaultRootKey(sharedVault)
  }

  async leaveSharedVault(sharedVault: SharedVaultListingInterface): Promise<ClientDisplayableError | void> {
    const useCase = new LeaveVaultUseCase(
      this.usersServer,
      this.items,
      this.mutator,
      this.encryption,
      this.storage,
      this.sync,
    )
    const result = await useCase.execute({
      sharedVault: sharedVault,
      userUuid: this.session.getSureUser().uuid,
    })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getSharedVaultUsers(
    sharedVault: SharedVaultListingInterface,
  ): Promise<SharedVaultUserServerHash[] | undefined> {
    const useCase = new GetSharedVaultUsersUseCase(this.usersServer)
    return useCase.execute({ sharedVaultUuid: sharedVault.sharing.sharedVaultUuid })
  }

  async shareContactWithUserAdministeredSharedVaults(contact: TrustedContactInterface): Promise<void> {
    if (contact.isMe) {
      throw new Error('Cannot share self contact')
    }

    const sharedVaults = this.getAllSharedVaults()

    const useCase = new ShareContactWithAllMembersOfSharedVaultUseCase(
      this.contacts,
      this.encryption,
      this.usersServer,
      this.messageServer,
    )

    for (const vault of sharedVaults) {
      if (!this.isCurrentUserSharedVaultAdmin(vault)) {
        continue
      }

      await useCase.execute({
        senderKeyPair: this.encryption.getKeyPair(),
        senderSigningKeyPair: this.encryption.getSigningKeyPair(),
        sharedVault: vault,
        contactToShare: contact,
        senderUserUuid: this.session.getSureUser().uuid,
      })
    }
  }

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.last_edited_by_uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.last_edited_by_uuid)

    return contact
  }

  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.user_uuid || item.user_uuid === this.session.getSureUser().uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.user_uuid)

    return contact
  }

  async revokeOwnKeySet(keyset: ContactPublicKeySetInterface): Promise<Result<void>> {
    const encryptUseCase = new EncryptAsymmetricMessagePayload(this.encryption.operators)
    const sendMessageUseCase = new SendAsymmetricMessageUseCase(this.messageServer)
    const getOutboundMessages = new GetOutboundAsymmetricMessages(this.messageServer)
    const getAdditionalData = new GetAsymmetricStringAdditionalData(this.encryption.operators)

    const usecase = new RevokePublicKeyUseCase(
      this.mutator,
      this.contacts,
      this.messageServer,
      this.invitesServer,
      encryptUseCase,
      sendMessageUseCase,
      getOutboundMessages,
      getAdditionalData,
    )

    const selfContact = this.contacts.getSelfContact()
    if (!selfContact) {
      return Result.fail('Cannot find self contact')
    }

    const result = await usecase.execute({
      selfContact,
      revokeKeySet: keyset,
      senderEncryptionKeyPair: this.encryption.getKeyPair(),
      senderSigningKeyPair: this.encryption.getSigningKeyPair(),
    })

    return result
  }

  override deinit(): void {
    super.deinit()
    ;(this.contacts as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.files as unknown) = undefined
    ;(this.invitesServer as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.messageServer as unknown) = undefined
    ;(this.server as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.usersServer as unknown) = undefined
    ;(this.vaults as unknown) = undefined
  }
}
