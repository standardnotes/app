import { SyncEventReceivedRemoteGroupsData } from './../Event/SyncEvent'
import { AddContactToGroupUseCase } from './UseCase/AddContactToGroup'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  User,
  isErrorResponse,
  GroupUserServerHash,
  isClientDisplayableError,
  GroupPermission,
  GroupServerHash,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  GroupsServerInterface,
  GroupUsersServerInterface,
  GroupInvitesServerInterface,
  GroupUsersServer,
  GroupInvitesServer,
  GroupsServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  VaultKeyCopyContentSpecialized,
  PayloadEmitSource,
  TrustedContactInterface,
  VaultKeyCopyInterface,
  VaultItemsKeyInterface,
} from '@standardnotes/models'
import { GroupServiceInterface } from './GroupServiceInterface'
import { GroupServiceEvent, GroupServiceEventPayload } from './GroupServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
import { GetGroupUsersUseCase } from './UseCase/GetGroupUsers'
import { RemoveVaultMemberUseCase } from './UseCase/RemoveGroupMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedGroupInvitesData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { FilesClientInterface } from '@standardnotes/files'
import { ReloadRemovedUseCase } from './UseCase/ReloadRemovedGroup'
import { LeaveVaultUseCase } from './UseCase/LeaveGroup'
import { UpdateInvitesAfterGroupDataChangeUseCase } from './UseCase/UpdateInvitesAfterGroupDataChange'
import { ApplicationStage } from '../Application/ApplicationStage'
import { GroupCacheServiceInterface } from './GroupCacheServiceInterface'
import { UpdateGroupUseCase } from './UseCase/UpdateGroup'
import { AddItemToGroupUseCase } from './UseCase/AddItemToGroup'
import { RemoveItemFromGroupUseCase } from './UseCase/RemoveItemFromGroup'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { GroupCacheService } from './GroupCacheService'

export class GroupService
  extends AbstractService<GroupServiceEvent, GroupServiceEventPayload>
  implements GroupServiceInterface, InternalEventHandlerInterface
{
  private groupServer: GroupsServerInterface
  private groupUsersServer: GroupUsersServerInterface
  private groupInvitesServer: GroupInvitesServerInterface

  private eventDisposers: (() => void)[] = []

  private pendingInvites: Record<string, GroupInviteServerHash> = {}
  private groupsCache: GroupCacheServiceInterface

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

    this.groupsCache = new GroupCacheService(storage)
    this.groupServer = new GroupsServer(http)
    this.groupUsersServer = new GroupUsersServer(http)
    this.groupInvitesServer = new GroupInvitesServer(http)

    this.eventDisposers.push(
      sync.addEventObserver(async (event, data) => {
        if (event === SyncEvent.ReceivedGroupInvites) {
          await this.processInboundInvites(data as SyncEventReceivedGroupInvitesData)
        } else if (event === SyncEvent.ReceivedRemoteGroups) {
          this.groupsCache.updateGroups(data as SyncEventReceivedRemoteGroupsData)
          void this.notifyEvent(GroupServiceEvent.GroupStatusChanged)
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
        if (source !== PayloadEmitSource.LocalChanged) {
          return
        }

        const insertedOrChanged = [...inserted, ...changed]
        void this.automaticallyAddOrRemoveItemsFromGroupAfterChanges(insertedOrChanged)
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

  private async handleInsertionOfNewVaultItemsKeys(vaultItemsKeys: VaultItemsKeyInterface[]): Promise<void> {
    for (const vaultItemsKey of vaultItemsKeys) {
      if (!vaultItemsKey.vault_system_identifier) {
        throw new Error('Vault items key does not have a vault system identifier')
      }

      const group = this.groupsCache.getGroupForVaultSystemIdentifier(vaultItemsKey.vault_system_identifier)
      if (group) {
        const primaryVaultItemsKey = this.items.getPrimaryVaultItemsKeyForVault(vaultItemsKey.vault_system_identifier)
        const updateGroupUseCase = new UpdateGroupUseCase(this.groupServer)
        const updateResult = await updateGroupUseCase.execute({
          groupUuid: group.uuid,
          specifiedItemsKeyUuid: primaryVaultItemsKey.uuid,
        })

        if (!isClientDisplayableError(updateResult)) {
          this.groupsCache.setGroup(updateResult)
        }
      }
    }
  }

  private async handleChangeInVaultKeys(changed: VaultKeyCopyInterface[]): Promise<void> {
    for (const changedKey of changed) {
      const group = this.groupsCache.getGroupForVaultSystemIdentifier(changedKey.vaultSystemIdentifier)
      if (group) {
        await this.updateInvitesAfterVaultKeyChange({
          vaultSystemIdentifier: changedKey.vaultSystemIdentifier,
          groupUuid: group.uuid,
        })
      }
    }
  }

  private async automaticallyAddOrRemoveItemsFromGroupAfterChanges(items: DecryptedItemInterface[]): Promise<void> {
    for (const item of items) {
      if (item.vault_system_identifier && !item.group_uuid) {
        const group = this.groupsCache.getGroupForVaultSystemIdentifier(item.vault_system_identifier)
        if (group) {
          await this.addItemToGroup(group.uuid, item)
        }
      }

      if (!item.vault_system_identifier && item.group_uuid) {
        const group = this.groupsCache.getGroup(item.group_uuid)
        if (group) {
          await this.removeItemFromGroup(item)
        }
      }
    }

    await this.sync.sync()
  }

  public getGroupSharingVaultSystemIdentifier(vaultSystemIdentifier: string): GroupServerHash | undefined {
    return this.groupsCache.getGroupForVaultSystemIdentifier(vaultSystemIdentifier)
  }

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.Launched_10) {
      void this.reloadRemovedVaults()
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(
        this.groupServer,
        this.groupInvitesServer,
        this.encryption,
        this.contacts,
        this.items,
      )
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  public async reloadRemoteGroups(): Promise<GroupServerHash[] | ClientDisplayableError> {
    const response = await this.groupServer.getGroups()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get vaults ${response}`)
    }

    const groups = response.data.groups

    this.groupsCache.updateGroups(groups)

    return groups
  }

  public getCachedInboundInvites(): GroupInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  /**
   * @TODO
   */
  public isUserGroupAdmin(_userUuid: string): boolean {
    return false
  }

  public isGroupUserOwnUser(user: GroupUserServerHash): boolean {
    return user.user_uuid === this.session.userUuid
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]> {
    const response = await this.groupInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    this.pendingInvites = {}

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(groupUuid?: string): Promise<GroupInviteServerHash[] | ClientDisplayableError> {
    const response = await this.groupInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    if (groupUuid) {
      return response.data.invites.filter((invite) => invite.group_uuid === groupUuid)
    }

    return response.data.invites
  }

  public async updateGroup(params: {
    groupUuid: string
    specifiedItemsKeyUuid: string
  }): Promise<GroupServerHash | ClientDisplayableError> {
    const useCase = new UpdateGroupUseCase(this.groupServer)
    return useCase.execute({
      groupUuid: params.groupUuid,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })
  }

  public async deleteInvite(invite: GroupInviteServerHash): Promise<ClientDisplayableError | void> {
    const response = await this.groupInvitesServer.deleteInvite({
      groupUuid: invite.group_uuid,
      inviteUuid: invite.uuid,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to delete invite ${response}`)
    }

    delete this.pendingInvites[invite.uuid]
  }

  private async processInboundInvites(invites: GroupInviteServerHash[]): Promise<void> {
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
    await this.notifyEventSync(GroupServiceEvent.GroupStatusChanged)
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

  async acceptInvite(invite: GroupInviteServerHash): Promise<boolean> {
    if (!this.getTrustedSenderOfInvite(invite)) {
      return false
    }

    const useCase = new AcceptInvite(this.userDecryptedPrivateKey, this.groupInvitesServer, this.items, this.encryption)
    const result = await useCase.execute(invite)
    if (result === 'errored') {
      return false
    }

    delete this.pendingInvites[invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsAfterInviteAccept()

    if (result === 'inserted') {
      void this.syncGroupFromScratch(invite.group_uuid)
    }

    return true
  }

  public reloadRemovedVaults(): Promise<void> {
    const useCase = new ReloadRemovedUseCase(this.groupServer, this.items)

    return useCase.execute()
  }

  public getTrustedSenderOfInvite(invite: GroupInviteServerHash): TrustedContactInterface | undefined {
    const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
    if (trustedContact && trustedContact.publicKey === invite.inviter_public_key) {
      return trustedContact
    }
    return undefined
  }

  private async decryptErroredItemsAfterInviteAccept(): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async syncGroupFromScratch(groupUuid: string): Promise<void> {
    await this.sync.syncGroupsFromScratch([groupUuid])
  }

  get user(): User {
    return this.session.getSureUser()
  }

  get userPublicKey(): string {
    const publicKey = this.session.getPublicKey()
    if (!publicKey) {
      throw new Error('Public key not found')
    }

    return publicKey
  }

  get userDecryptedPrivateKey(): string {
    const key = this.encryption.getDecryptedPrivateKey()
    if (!key) {
      throw new Error('Decrypted private key not found')
    }

    return key
  }

  public async getInvitableContactsForGroup(groupUuid: string): Promise<TrustedContactInterface[]> {
    const users = await this.getGroupUsers(groupUuid)
    if (!users) {
      return []
    }

    const contacts = this.contacts.getAllContacts()
    return contacts.filter((contact) => {
      const isContactAlreadyInVault = users.some((user) => user.user_uuid === contact.contactUuid)
      return !isContactAlreadyInVault
    })
  }

  public async addItemToGroup(groupUuid: string, item: DecryptedItemInterface): Promise<void | ClientDisplayableError> {
    const useCase = new AddItemToGroupUseCase(this.groupServer, this.files)
    const result = await useCase.execute({
      item: item,
      groupUuid: groupUuid,
    })

    return result
  }

  public async removeItemFromGroup(item: DecryptedItemInterface): Promise<void | ClientDisplayableError> {
    if (!item.group_uuid) {
      throw new Error('Item does not have a group uuid')
    }

    const useCase = new RemoveItemFromGroupUseCase(this.groupServer, this.files)
    const result = await useCase.execute({
      item: item,
      groupUuid: item.group_uuid,
    })

    return result
  }

  async inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContactInterface,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const useCase = new AddContactToGroupUseCase(this.encryption, this.groupInvitesServer, this.items)
    const result = await useCase.execute({
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
      group,
      contact,
      permissions,
    })

    void this.notifyCollaborationStatusChanged()

    await this.sync.sync()

    return result
  }

  public getInviteData(invite: GroupInviteServerHash): VaultKeyCopyContentSpecialized | undefined {
    return this.encryption.decryptVaultKeyContentWithPrivateKey(
      invite.encrypted_vault_key_content,
      invite.inviter_public_key,
      this.userDecryptedPrivateKey,
    )
  }

  async removeUserFromGroup(groupUuid: string, userUuid: string): Promise<ClientDisplayableError | void> {
    if (!this.isUserGroupAdmin(groupUuid)) {
      throw new Error('Only vault admins can remove users')
    }

    const useCase = new RemoveVaultMemberUseCase(this.groupUsersServer)
    const result = await useCase.execute({ groupUuid, userUuid })
    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()

    const vaultSystemIdentifier = this.groupsCache.getVaultSystemIdentifierForGroup(groupUuid)
    if (!vaultSystemIdentifier) {
      throw new Error('Vault system identifier not found')
    }

    await this.notifyEventSync(GroupServiceEvent.GroupMemberRemoved, { groupUuid, vaultSystemIdentifier })
  }

  async leaveGroup(groupUuid: string): Promise<ClientDisplayableError | void> {
    const useCase = new LeaveVaultUseCase(this.groupUsersServer, this.items)
    const result = await useCase.execute({ groupUuid, userUuid: this.user.uuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    void this.notifyCollaborationStatusChanged()
  }

  async getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined> {
    const useCase = new GetGroupUsersUseCase(this.groupUsersServer)
    return useCase.execute({ groupUuid })
  }

  getItemLastEditedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.last_edited_by_uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.last_edited_by_uuid)

    return contact
  }

  getItemSharedBy(item: DecryptedItemInterface): TrustedContactInterface | undefined {
    if (!item.user_uuid || item.user_uuid === this.user.uuid) {
      return undefined
    }

    const contact = this.contacts.findTrustedContact(item.user_uuid)

    return contact
  }

  public updateInvitesAfterVaultKeyChange(params: {
    vaultSystemIdentifier: string
    groupUuid: string
  }): Promise<ClientDisplayableError[]> {
    const useCase = new UpdateInvitesAfterGroupDataChangeUseCase(
      this.encryption,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
      this.items,
    )

    return useCase.execute({
      vaultSystemIdentifier: params.vaultSystemIdentifier,
      groupUuid: params.groupUuid,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })
  }

  override deinit(): void {
    super.deinit()
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.groupServer as unknown) = undefined
    ;(this.contacts as unknown) = undefined
    ;(this.files as unknown) = undefined
    for (const disposer of this.eventDisposers) {
      disposer()
    }
    this.eventDisposers = []
  }
}
