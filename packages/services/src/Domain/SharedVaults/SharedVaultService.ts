import { SyncEventReceivedRemoteSharedVaultsData } from './../Event/SyncEvent'
import { AddContactToSharedVaultUseCase } from './UseCase/AddContactToSharedVault'
import {
  ClientDisplayableError,
  SharedVaultInviteServerHash,
  isErrorResponse,
  SharedVaultUserServerHash,
  isClientDisplayableError,
  SharedVaultPermission,
  SharedVaultServerHash,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  SharedVaultServerInterface,
  SharedVaultUsersServerInterface,
  SharedVaultInvitesServerInterface,
  SharedVaultUsersServer,
  SharedVaultInvitesServer,
  SharedVaultServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  PayloadEmitSource,
  TrustedContactInterface,
  VaultKeyCopyInterface,
  VaultItemsKeyInterface,
  KeySystemIdentifier,
} from '@standardnotes/models'
import { SharedVaultServiceInterface } from './SharedVaultServiceInterface'
import { SharedVaultServiceEvent, SharedVaultServiceEventPayload } from './SharedVaultServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
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
import { ReloadRemovedUseCase } from './UseCase/ReloadRemovedSharedVault'
import { LeaveVaultUseCase } from './UseCase/LeaveSharedVault'
import { UpdateInvitesAfterSharedVaultDataChangeUseCase } from './UseCase/UpdateInvitesAfterSharedVaultDataChange'
import { ApplicationStage } from '../Application/ApplicationStage'
import { SharedVaultCacheServiceInterface } from './SharedVaultCacheServiceInterface'
import { UpdateSharedVaultUseCase } from './UseCase/UpdateSharedVault'
import { AddItemToSharedVaultUseCase } from './UseCase/AddItemToSharedVault'
import { RemoveItemFromSharedVaultUseCase } from './UseCase/RemoveItemFromSharedVault'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { SharedVaultCacheService } from './SharedVaultCacheService'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  private sharedVault: SharedVaultServerInterface
  private sharedVaultUsersServer: SharedVaultUsersServerInterface
  private sharedVaultInvitesServer: SharedVaultInvitesServerInterface

  private eventDisposers: (() => void)[] = []

  private pendingInvites: Record<string, SharedVaultInviteServerHash> = {}
  private sharedVaultCache: SharedVaultCacheServiceInterface

  constructor(
    http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private files: FilesClientInterface,
    storage: StorageServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.sharedVaultCache = new SharedVaultCacheService(storage)
    this.sharedVault = new SharedVaultServer(http)
    this.sharedVaultUsersServer = new SharedVaultUsersServer(http)
    this.sharedVaultInvitesServer = new SharedVaultInvitesServer(http)

    this.eventDisposers.push(
      sync.addEventObserver(async (event, data) => {
        if (event === SyncEvent.ReceivedSharedVaultInvites) {
          await this.processInboundInvites(data as SyncEventReceivedSharedVaultInvitesData)
        } else if (event === SyncEvent.ReceivedRemoteSharedVaults) {
          this.sharedVaultCache.updateSharedVaults(data as SyncEventReceivedRemoteSharedVaultsData)
          void this.notifyEvent(SharedVaultServiceEvent.SharedVaultStatusChanged)
        }
      }),
    )

    this.eventDisposers.push(
      items.addObserver<TrustedContactInterface>(ContentType.TrustedContact, ({ inserted, source }) => {
        if (source === PayloadEmitSource.LocalChanged && inserted.length > 0) {
          void this.handleCreationOfNewTrustedContacts(inserted)
        }
      }),
    )

    this.eventDisposers.push(
      items.addObserver(ContentType.Any, ({ inserted, changed, source }) => {
        if (source !== PayloadEmitSource.RemoteSaved) {
          return
        }

        const insertedOrChanged = [...inserted, ...changed]
        void this.automaticallyAddOrRemoveItemsFromSharedVaultAfterChanges(insertedOrChanged)
      }),
    )

    this.eventDisposers.push(
      items.addObserver<VaultKeyCopyInterface>(ContentType.VaultKeyCopy, ({ changed, source }) => {
        if (source !== PayloadEmitSource.LocalChanged) {
          return
        }

        void this.handleChangeInVaultKeys(changed)
      }),
    )

    this.eventDisposers.push(
      items.addObserver<VaultItemsKeyInterface>(ContentType.VaultItemsKey, ({ inserted, source }) => {
        if (source !== PayloadEmitSource.LocalInserted) {
          return
        }

        void this.handleInsertionOfNewVaultItemsKeys(inserted)
      }),
    )
  }

  override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.Launched_10) {
      void this.reloadRemovedSharedVaults()
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(
        this.sharedVault,
        this.sharedVaultInvitesServer,
        this.encryption,
        this.contacts,
        this.items,
      )
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  private async handleInsertionOfNewVaultItemsKeys(vaultItemsKeys: VaultItemsKeyInterface[]): Promise<void> {
    for (const vaultItemsKey of vaultItemsKeys) {
      if (!vaultItemsKey.key_system_identifier) {
        throw new Error('Vault items key does not have a vault system identifier')
      }

      const sharedVault = this.sharedVaultCache.getSharedVaultForKeySystemIdentifier(
        vaultItemsKey.key_system_identifier,
      )
      if (sharedVault) {
        const primaryVaultItemsKey = this.items.getPrimaryVaultItemsKeyForVault(vaultItemsKey.key_system_identifier)
        const updateSharedVaultUseCase = new UpdateSharedVaultUseCase(this.sharedVault)
        const updateResult = await updateSharedVaultUseCase.execute({
          sharedVaultUuid: sharedVault.uuid,
          specifiedItemsKeyUuid: primaryVaultItemsKey.uuid,
        })

        if (!isClientDisplayableError(updateResult)) {
          this.sharedVaultCache.setSharedVault(updateResult)
        }
      }
    }
  }

  private async handleChangeInVaultKeys(changed: VaultKeyCopyInterface[]): Promise<void> {
    const handledVaults = new Set()

    for (const changedKey of changed) {
      if (handledVaults.has(changedKey.keySystemIdentifier)) {
        continue
      }

      const sharedVault = this.sharedVaultCache.getSharedVaultForKeySystemIdentifier(changedKey.keySystemIdentifier)
      if (!sharedVault) {
        continue
      }

      if (!this.isCurrentUserSharedVaultOwner(sharedVault.uuid)) {
        continue
      }

      const primaryKey = this.items.getPrimarySyncedVaultKeyCopy(changedKey.keySystemIdentifier)
      if (changedKey.uuid !== primaryKey?.uuid) {
        continue
      }

      handledVaults.add(changedKey.keySystemIdentifier)

      await this.updateInvitesAfterVaultKeyChange({
        keySystemIdentifier: changedKey.keySystemIdentifier,
        sharedVaultUuid: sharedVault.uuid,
      })
    }
  }

  private async automaticallyAddOrRemoveItemsFromSharedVaultAfterChanges(
    items: DecryptedItemInterface[],
  ): Promise<void> {
    let needsSync = false
    for (const item of items) {
      if (item.key_system_identifier && !item.shared_vault_uuid) {
        const sharedVault = this.sharedVaultCache.getSharedVaultForKeySystemIdentifier(item.key_system_identifier)
        if (sharedVault) {
          await this.addItemToSharedVault(sharedVault.uuid, item)
          needsSync = true
        }
      }

      if (!item.key_system_identifier && item.shared_vault_uuid) {
        const sharedVault = this.sharedVaultCache.getSharedVault(item.shared_vault_uuid)
        if (sharedVault) {
          await this.removeItemFromSharedVault(item)
          needsSync = true
        }
      }
    }

    if (needsSync) {
      await this.sync.sync()
    }
  }

  async createSharedVault(params: {
    keySystemIdentifier: KeySystemIdentifier
  }): Promise<SharedVaultServerHash | ClientDisplayableError> {
    const vaultItemsKey = this.items.getPrimaryVaultItemsKeyForVault(params.keySystemIdentifier)
    if (!vaultItemsKey) {
      return ClientDisplayableError.FromString(`No vault items key found for vault ${params.keySystemIdentifier}`)
    }

    const result = await this.sharedVault.createSharedVault({
      keySystemIdentifier: params.keySystemIdentifier,
      specifiedItemsKeyUuid: vaultItemsKey.uuid,
    })

    if (isErrorResponse(result)) {
      return ClientDisplayableError.FromString(`Failed to create sharedVault ${result}`)
    }

    const sharedVault = result.data.sharedVault

    this.sharedVaultCache.setSharedVault(sharedVault)

    const vaultItems = this.items.itemsBelongingToKeySystem(params.keySystemIdentifier)
    for (const vaultItem of vaultItems) {
      await this.addItemToSharedVault(sharedVault.uuid, vaultItem)
    }

    return sharedVault
  }

  public async reloadRemoteSharedVaults(): Promise<SharedVaultServerHash[] | ClientDisplayableError> {
    const response = await this.sharedVault.getSharedVaults()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get vaults ${response}`)
    }

    const sharedVaults = response.data.sharedVaults

    this.sharedVaultCache.updateSharedVaults(sharedVaults)

    return sharedVaults
  }

  public getCachedInboundInvites(): SharedVaultInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  public isCurrentUserSharedVaultAdmin(sharedVaultUuid: string): boolean {
    const sharedVault = this.sharedVaultCache.getSharedVault(sharedVaultUuid)
    return sharedVault != undefined && sharedVault.user_uuid === this.session.userUuid
  }

  public isCurrentUserSharedVaultOwner(sharedVaultUuid: string): boolean {
    const sharedVault = this.sharedVaultCache.getSharedVault(sharedVaultUuid)
    return sharedVault != undefined && sharedVault.user_uuid === this.session.userUuid
  }

  public isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean {
    const sharedVault = this.sharedVaultCache.getSharedVault(user.shared_vault_uuid)
    return sharedVault != undefined && sharedVault.user_uuid === user.user_uuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | SharedVaultInviteServerHash[]> {
    const response = await this.sharedVaultInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(
    sharedVaultUuid?: string,
  ): Promise<SharedVaultInviteServerHash[] | ClientDisplayableError> {
    const response = await this.sharedVaultInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (sharedVaultUuid) {
      return response.data.invites.filter((invite) => invite.shared_vault_uuid === sharedVaultUuid)
    }

    return response.data.invites
  }

  public async updateSharedVault(params: {
    sharedVaultUuid: string
    specifiedItemsKeyUuid: string
  }): Promise<SharedVaultServerHash | ClientDisplayableError> {
    const useCase = new UpdateSharedVaultUseCase(this.sharedVault)
    return useCase.execute({
      sharedVaultUuid: params.sharedVaultUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })
  }

  public async deleteInvite(invite: SharedVaultInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.sharedVaultInvitesServer.deleteInvite({
      sharedVaultUuid: invite.shared_vault_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  private async processInboundInvites(invites: SharedVaultInviteServerHash[]): Promise<void> {
    if (invites.length === 0) {
      return
    }

    for (const invite of invites) {
      this.pendingInvites[invite.uuid] = invite
    }

    await this.automaticallyAcceptTrustedKeyChangeInvites()

    await this.notifyCollaborationStatusChanged()
  }

  private async notifyCollaborationStatusChanged(): Promise<void> {
    await this.notifyEventSync(SharedVaultServiceEvent.SharedVaultStatusChanged)
  }

  private async automaticallyAcceptTrustedKeyChangeInvites(): Promise<void> {
    const trustedKeyChangeInvites = this.getCachedInboundInvites().filter((invite) => {
      return this.getTrustedSenderOfInvite(invite) && invite.invite_type === 'key-change'
    })

    if (trustedKeyChangeInvites.length > 0) {
      for (const invite of trustedKeyChangeInvites) {
        await this.acceptInvite(invite)
      }
    }
  }

  async acceptInvite(invite: SharedVaultInviteServerHash): Promise<boolean> {
    if (!this.getTrustedSenderOfInvite(invite)) {
      return false
    }

    const useCase = new AcceptInvite(
      this.encryption.getDecryptedPrivateKey(),
      this.sharedVaultInvitesServer,
      this.items,
      this.encryption,
    )
    const result = await useCase.execute(invite)
    if (result === 'errored') {
      return false
    }

    delete this.pendingInvites[invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsAfterInviteAccept()

    if (result === 'inserted') {
      void this.syncSharedVaultFromScratch(invite.shared_vault_uuid)
    }

    return true
  }

  public async reloadRemovedSharedVaults(): Promise<void> {
    if (!this.session.isSignedIn()) {
      return
    }

    const useCase = new ReloadRemovedUseCase(this.sharedVault, this.items)
    return useCase.execute()
  }

  public getTrustedSenderOfInvite(invite: SharedVaultInviteServerHash): TrustedContactInterface | undefined {
    const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
    if (trustedContact && trustedContact.publicKey === invite.inviter_public_key) {
      return trustedContact
    }
    return undefined
  }

  private async decryptErroredItemsAfterInviteAccept(): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async syncSharedVaultFromScratch(sharedVaultUuid: string): Promise<void> {
    await this.sync.syncSharedVaultsFromScratch([sharedVaultUuid])
  }

  public async getInvitableContactsForSharedVault(sharedVaultUuid: string): Promise<TrustedContactInterface[]> {
    const users = await this.getSharedVaultUsers(sharedVaultUuid)
    if (!users) {
      return []
    }

    const contacts = this.contacts.getAllContacts()
    return contacts.filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  public async addItemToSharedVault(
    sharedVaultUuid: string,
    item: DecryptedItemInterface,
  ): Promise<void | ClientDisplayableError> {
    const useCase = new AddItemToSharedVaultUseCase(this.sharedVault, this.files, this.items)
    const result = await useCase.execute({
      item: item,
      sharedVaultUuid: sharedVaultUuid,
    })

    return result
  }

  public async removeItemFromSharedVault(item: DecryptedItemInterface): Promise<void | ClientDisplayableError> {
    if (!item.shared_vault_uuid) {
      throw new Error('Item does not have a sharedVault uuid')
    }

    const useCase = new RemoveItemFromSharedVaultUseCase(this.sharedVault, this.files, this.items)
    const result = await useCase.execute({
      item: item,
      sharedVaultUuid: item.shared_vault_uuid,
    })

    return result
  }

  async inviteContactToSharedVault(
    sharedVault: SharedVaultServerHash,
    contact: TrustedContactInterface,
    permissions: SharedVaultPermission,
  ): Promise<SharedVaultInviteServerHash | ClientDisplayableError> {
    const useCase = new AddContactToSharedVaultUseCase(this.encryption, this.sharedVaultInvitesServer, this.items)
    const result = await useCase.execute({
      inviterPrivateKey: this.encryption.getDecryptedPrivateKey(),
      inviterPublicKey: this.session.getPublicKey(),
      sharedVault,
      contact,
      permissions,
    })

    void this.notifyCollaborationStatusChanged()

    await this.sync.sync()

    return result
  }

  public getInviteData(invite: SharedVaultInviteServerHash): VaultKeyCopyContentSpecialized | undefined {
    return this.encryption.decryptVaultKeyContentWithPrivateKey(
      invite.encrypted_vault_key_content,
      invite.inviter_public_key,
      this.encryption.getDecryptedPrivateKey(),
    )
  }

  async removeUserFromSharedVault(sharedVaultUuid: string, userUuid: string): Promise<ClientDisplayableError | void> {
    if (!this.isCurrentUserSharedVaultAdmin(sharedVaultUuid)) {
      throw new Error('Only vault admins can remove users')
    }

    const useCase = new RemoveVaultMemberUseCase(this.sharedVaultUsersServer)
    const result = await useCase.execute({ sharedVaultUuid, userUuid })
    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    const keySystemIdentifier = this.sharedVaultCache.getKeySystemIdentifierForSharedVault(sharedVaultUuid)
    if (!keySystemIdentifier) {
      throw new Error('Vault system identifier not found')
    }

    await this.notifyEventSync(SharedVaultServiceEvent.SharedVaultMemberRemoved, {
      sharedVaultUuid,
      keySystemIdentifier,
    })
  }

  async leaveSharedVault(sharedVaultUuid: string): Promise<ClientDisplayableError | void> {
    const useCase = new LeaveVaultUseCase(this.sharedVaultUsersServer, this.items)
    const result = await useCase.execute({ sharedVaultUuid, userUuid: this.session.getSureUser().uuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getSharedVaultUsers(sharedVaultUuid: string): Promise<SharedVaultUserServerHash[] | undefined> {
    const useCase = new GetSharedVaultUsersUseCase(this.sharedVaultUsersServer)
    return useCase.execute({ sharedVaultUuid })
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

  public updateInvitesAfterVaultKeyChange(params: {
    keySystemIdentifier: KeySystemIdentifier
    sharedVaultUuid: string
  }): Promise<ClientDisplayableError[]> {
    const useCase = new UpdateInvitesAfterSharedVaultDataChangeUseCase(
      this.encryption,
      this.sharedVaultInvitesServer,
      this.sharedVaultUsersServer,
      this.contacts,
      this.items,
    )

    return useCase.execute({
      keySystemIdentifier: params.keySystemIdentifier,
      sharedVaultUuid: params.sharedVaultUuid,
      inviterUuid: this.session.getSureUser().uuid,
      inviterPrivateKey: this.encryption.getDecryptedPrivateKey(),
      inviterPublicKey: this.session.getPublicKey(),
    })
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.sharedVault as unknown) = undefined
    ;(this.contacts as unknown) = undefined
    ;(this.files as unknown) = undefined
    for (const disposer of this.eventDisposers) {
      disposer()
    }
    this.eventDisposers = []
  }
}
