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
  KeySystemRootKeyContentSpecialized,
  PayloadEmitSource,
  TrustedContactInterface,
  KeySystemRootKeyInterface,
  KeySystemItemsKeyInterface,
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
import { LeaveVaultUseCase } from './UseCase/LeaveSharedVault'
import { UpdateInvitesAfterSharedVaultDataChangeUseCase } from './UseCase/UpdateInvitesAfterSharedVaultDataChange'
import { UpdateSharedVaultUseCase } from './UseCase/UpdateSharedVault'
import { VaultServiceInterface } from '../Vaults/VaultServiceInterface'
import { assert } from '@standardnotes/utils'
import { VaultDisplayListing } from '../Vaults/VaultDisplayListing'

export class SharedVaultService
  extends AbstractService<SharedVaultServiceEvent, SharedVaultServiceEventPayload>
  implements SharedVaultServiceInterface, InternalEventHandlerInterface
{
  private sharedVaultServer: SharedVaultServerInterface
  private sharedVaultUsersServer: SharedVaultUsersServerInterface
  private sharedVaultInvitesServer: SharedVaultInvitesServerInterface

  private eventDisposers: (() => void)[] = []

  private pendingInvites: Record<string, SharedVaultInviteServerHash> = {}

  constructor(
    http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private files: FilesClientInterface,
    private vaults: VaultServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.sharedVaultServer = new SharedVaultServer(http)
    this.sharedVaultUsersServer = new SharedVaultUsersServer(http)
    this.sharedVaultInvitesServer = new SharedVaultInvitesServer(http)

    this.eventDisposers.push(
      sync.addEventObserver(async (event, data) => {
        if (event === SyncEvent.ReceivedSharedVaultInvites) {
          await this.processInboundInvites(data as SyncEventReceivedSharedVaultInvitesData)
        } else if (event === SyncEvent.ReceivedRemoteSharedVaults) {
          void this.notifyCollaborationStatusChanged()
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
      items.addObserver<KeySystemRootKeyInterface>(ContentType.KeySystemRootKey, ({ changed, source }) => {
        if (source !== PayloadEmitSource.LocalChanged) {
          return
        }

        void this.handleChangeInKeySystemRootKeys(changed)
      }),
    )

    this.eventDisposers.push(
      items.addObserver<KeySystemItemsKeyInterface>(ContentType.KeySystemItemsKey, ({ inserted, source }) => {
        if (source !== PayloadEmitSource.LocalInserted) {
          return
        }

        void this.updatedSharedVaultSpecifiedItemsKeyAfterInsertionOfNewKeySystemItemsKeys(inserted)
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(
        this.sharedVaultServer,
        this.sharedVaultInvitesServer,
        this.encryption,
        this.contacts,
        this.items,
      )
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  private async updatedSharedVaultSpecifiedItemsKeyAfterInsertionOfNewKeySystemItemsKeys(
    keySystemItemsKeys: KeySystemItemsKeyInterface[],
  ): Promise<void> {
    const handledKeySystems = new Set()
    for (const keySystemItemsKey of keySystemItemsKeys) {
      if (!keySystemItemsKey.key_system_identifier) {
        throw new Error('Vault items key does not have a key system identifier')
      }

      if (handledKeySystems.has(keySystemItemsKey.key_system_identifier)) {
        continue
      }

      handledKeySystems.add(keySystemItemsKey.key_system_identifier)

      const vault = this.vaults.getVault(keySystemItemsKey.key_system_identifier)
      if (!vault) {
        continue
      }

      if (vault.sharedVaultUuid) {
        const primaryKeySystemItemsKey = this.items.getPrimaryKeySystemItemsKey(keySystemItemsKey.key_system_identifier)
        const updateSharedVaultUseCase = new UpdateSharedVaultUseCase(this.sharedVaultServer)
        await updateSharedVaultUseCase.execute({
          sharedVaultUuid: vault.sharedVaultUuid,
          specifiedItemsKeyUuid: primaryKeySystemItemsKey.uuid,
        })
      }
    }
  }

  private async handleChangeInKeySystemRootKeys(changedRootKeys: KeySystemRootKeyInterface[]): Promise<void> {
    const handledVaults = new Set()

    for (const changedRootKey of changedRootKeys) {
      if (handledVaults.has(changedRootKey.systemIdentifier)) {
        continue
      }

      const vault = this.vaults.getVault(changedRootKey.systemIdentifier)
      if (!vault || !vault.sharedVaultUuid) {
        continue
      }

      if (!this.isCurrentUserSharedVaultOwner(vault.sharedVaultUuid)) {
        continue
      }

      const primaryKey = this.items.getPrimaryKeySystemRootKey(changedRootKey.systemIdentifier)
      if (changedRootKey.uuid !== primaryKey?.uuid) {
        continue
      }

      handledVaults.add(changedRootKey.systemIdentifier)

      await this.updateInvitesAfterKeySystemRootKeyChange({
        keySystemIdentifier: changedRootKey.systemIdentifier,
        sharedVaultUuid: vault.sharedVaultUuid,
      })
    }
  }

  async createSharedVault(name: string, description?: string): Promise<VaultDisplayListing | ClientDisplayableError> {
    const keySystemIdentifier = await this.vaults.createVault(name, description)
    if (isClientDisplayableError(keySystemIdentifier)) {
      return keySystemIdentifier
    }

    const keySystemItemsKey = this.items.getPrimaryKeySystemItemsKey(keySystemIdentifier)
    if (!keySystemItemsKey) {
      return ClientDisplayableError.FromString(`No vault items key found for vault ${keySystemIdentifier}`)
    }

    const result = await this.sharedVaultServer.createSharedVault({
      specifiedItemsKeyUuid: keySystemItemsKey.uuid,
      keySystemIdentifier,
    })

    if (isErrorResponse(result)) {
      return ClientDisplayableError.FromString(`Failed to create shared vault ${result}`)
    }

    const vault = this.vaults.getVault(keySystemIdentifier)
    assert(vault)

    const vaultItems = this.items.itemsBelongingToKeySystem(keySystemIdentifier)
    for (const item of vaultItems) {
      await this.vaults.addItemToVault(vault, item)
    }

    return vault
  }

  public getCachedInboundInvites(): SharedVaultInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  private findSharedVault(sharedVaultUuid: string): VaultDisplayListing | undefined {
    return this.vaults.getVaults().find((vault) => vault.sharedVaultUuid === sharedVaultUuid)
  }

  public isCurrentUserSharedVaultAdmin(sharedVaultUuid: string): boolean {
    const vault = this.findSharedVault(sharedVaultUuid)
    return vault != undefined && vault.ownerUserUuid === this.session.userUuid
  }

  public isCurrentUserSharedVaultOwner(sharedVaultUuid: string): boolean {
    const vault = this.findSharedVault(sharedVaultUuid)
    return vault != undefined && vault.ownerUserUuid === this.session.userUuid
  }

  public isSharedVaultUserSharedVaultOwner(user: SharedVaultUserServerHash): boolean {
    const vault = this.findSharedVault(user.shared_vault_uuid)
    return vault != undefined && vault.ownerUserUuid === user.user_uuid
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

  public async updateSharedVaultSpecifiedItemsKey(params: {
    sharedVaultUuid: string
    specifiedItemsKeyUuid: string
  }): Promise<SharedVaultServerHash | ClientDisplayableError> {
    const useCase = new UpdateSharedVaultUseCase(this.sharedVaultServer)
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

  public getInviteData(invite: SharedVaultInviteServerHash): KeySystemRootKeyContentSpecialized | undefined {
    return this.encryption.decryptKeySystemRootKeyContentWithPrivateKey(
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

    const vault = this.findSharedVault(sharedVaultUuid)
    if (!vault) {
      throw new Error('Could not find shared vault')
    }

    await this.vaults.rotateKeySystemRootKey(sharedVaultUuid)
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

  public updateInvitesAfterKeySystemRootKeyChange(params: {
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
    ;(this.sharedVaultServer as unknown) = undefined
    ;(this.contacts as unknown) = undefined
    ;(this.files as unknown) = undefined
    for (const disposer of this.eventDisposers) {
      disposer()
    }
    this.eventDisposers = []
  }
}
