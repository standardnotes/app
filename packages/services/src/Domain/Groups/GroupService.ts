import { UpdateGroupUseCase } from './UseCase/UpdateGroup'
import { AddContactToGroupUseCase } from './UseCase/AddContactToGroup'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupServerHash,
  User,
  isErrorResponse,
  GroupUserServerHash,
  isClientDisplayableError,
  GroupPermission,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  GroupsServer,
  GroupsServerInterface,
  GroupUsersServerInterface,
  GroupInvitesServerInterface,
  GroupUsersServer,
  GroupInvitesServer,
} from '@standardnotes/api'
import {
  DecryptedItemInterface,
  GroupKeyContentSpecialized,
  GroupKeyInterface,
  PayloadEmitSource,
  TrustedContactInterface,
} from '@standardnotes/models'
import { GroupServiceInterface } from './GroupServiceInterface'
import { GroupServiceEvent } from './GroupServiceEvent'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvite } from './UseCase/AcceptInvite'
import { CreateGroupUseCase } from './UseCase/CreateGroup'
import { RotateGroupKeyUseCase } from './UseCase/RotateGroupKey'
import { GetGroupUsersUseCase } from './UseCase/GetGroupUsers'
import { RemoveGroupMemberUseCase } from './UseCase/RemoveGroupMember'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { GroupStorageServiceInterface } from './GroupStorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent, SyncEventReceivedGroupInvitesData, SyncEventReceivedGroupsData } from '../Event/SyncEvent'
import { SessionEvent } from '../Session/SessionEvent'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { RemoveItemFromGroupUseCase } from './UseCase/RemoveItemFromGroup'
import { DeleteGroupUseCase } from './UseCase/DeleteGroup'
import { AddItemToGroupUseCase } from './UseCase/AddItemToGroup'
import { ChangeGroupMetadataUsecase } from './UseCase/ChangeGroupMetadata'

export class GroupService
  extends AbstractService<GroupServiceEvent>
  implements GroupServiceInterface, InternalEventHandlerInterface
{
  private groupsServer: GroupsServerInterface
  private groupUsersServer: GroupUsersServerInterface
  private groupInvitesServer: GroupInvitesServerInterface

  private syncEventDisposer: () => void
  private itemsEventDisposer: () => void

  private readonly pendingInvites: Record<string, GroupInviteServerHash> = {}

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    private groupStorage: GroupStorageServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.groupsServer = new GroupsServer(http)
    this.groupUsersServer = new GroupUsersServer(http)
    this.groupInvitesServer = new GroupInvitesServer(http)

    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedGroupInvites) {
        await this.processInboundInvites(data as SyncEventReceivedGroupInvitesData)
      }
      if (event === SyncEvent.ReceivedGroups) {
        await this.handleReceivedGroups(data as SyncEventReceivedGroupsData)
      }
    })
    this.itemsEventDisposer = items.addObserver<TrustedContactInterface>(
      ContentType.TrustedContact,
      ({ inserted, source }) => {
        if (source === PayloadEmitSource.LocalChanged && inserted.length > 0) {
          void this.handleCreationOfNewTrustedContacts(inserted)
        }
      },
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SessionEvent.SuccessfullyChangedCredentials) {
      const handler = new HandleSuccessfullyChangedCredentials(this.groupInvitesServer, this.encryption, this.contacts)
      await handler.execute(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  async handleReceivedGroups(groups: GroupServerHash[]): Promise<void> {
    this.groupStorage.updateGroups(groups)
  }

  public async reloadGroups(): Promise<GroupServerHash[] | ClientDisplayableError> {
    const response = await this.groupsServer.getGroups()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get groups ${response}`)
    }

    const groups = response.data.groups

    await this.handleReceivedGroups(groups)

    return groups
  }

  public getGroups(): GroupServerHash[] {
    return this.groupStorage.getGroups()
  }

  public getPendingInvites(): GroupInviteServerHash[] {
    return Object.values(this.pendingInvites)
  }

  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    await this.downloadInboundInvites()
  }

  public async downloadInboundInvites(): Promise<ClientDisplayableError | GroupInviteServerHash[]> {
    const response = await this.groupInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get inbound user invites ${response}`)
    }

    await this.processInboundInvites(response.data.invites)

    return response.data.invites
  }

  public async getOutboundInvites(): Promise<GroupInviteServerHash[] | ClientDisplayableError> {
    const response = await this.groupInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromString(`Failed to get outbound user invites ${response}`)
    }

    return response.data.invites
  }

  private async processInboundInvites(invites: GroupInviteServerHash[]): Promise<void> {
    if (invites.length === 0) {
      return
    }

    for (const invite of invites) {
      this.pendingInvites[invite.uuid] = invite
    }

    await this.automaticallyAcceptTrustedKeyChangeInvites()

    await this.notifyEventSync(GroupServiceEvent.DidResolveRemoteGroupInvites)
  }

  private async automaticallyAcceptTrustedKeyChangeInvites(): Promise<void> {
    const trustedKeyChangeInvites = this.getPendingInvites().filter((invite) => {
      return this.isInviteTrusted(invite) && invite.invite_type === 'key-change'
    })

    if (trustedKeyChangeInvites.length > 0) {
      for (const invite of trustedKeyChangeInvites) {
        await this.acceptInvite(invite)
      }
    }
  }

  async acceptInvite(invite: GroupInviteServerHash): Promise<boolean> {
    if (!this.isInviteTrusted(invite)) {
      return false
    }

    const useCase = new AcceptInvite(this.userDecryptedPrivateKey, this.groupInvitesServer, this.items, this.encryption)

    const result = await useCase.execute(invite)

    if (result === 'errored') {
      return false
    }

    delete this.pendingInvites[invite.uuid]

    void this.sync.sync()

    await this.decryptErroredItemsForGroup(invite.group_uuid)

    if (result === 'inserted') {
      void this.syncGroupFromScratch(invite.group_uuid)
    }

    return true
  }

  public isInviteTrusted(invite: GroupInviteServerHash): boolean {
    const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
    return !!trustedContact && trustedContact.publicKey === invite.inviter_public_key
  }

  private async decryptErroredItemsForGroup(_groupUuid: string): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async syncGroupFromScratch(groupUuid: string): Promise<void> {
    if (groupUuid.length === 0) {
      return
    }

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

  async createGroup(name?: string, description?: string): Promise<GroupServerHash | ClientDisplayableError> {
    const createGroup = new CreateGroupUseCase(this.items, this.groupsServer, this.encryption)
    const result = await createGroup.execute({
      groupName: name,
      groupDescription: description,
    })

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
    }

    return result
  }

  async inviteContactToGroup(
    group: GroupServerHash,
    contact: TrustedContactInterface,
    permissions: GroupPermission,
  ): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const useCase = new AddContactToGroupUseCase(this.encryption, this.groupInvitesServer)

    const result = await useCase.execute({
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
      group,
      contact,
      permissions,
    })

    await this.sync.sync()

    return result
  }

  async addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new AddItemToGroupUseCase(this.items)
    await useCase.execute({ groupUuid: group.uuid, item })

    await this.sync.sync()

    return this.items.findSureItem(item.uuid)
  }

  async removeItemFromItsGroup(item: DecryptedItemInterface): Promise<DecryptedItemInterface> {
    const useCase = new RemoveItemFromGroupUseCase(this.items)
    await useCase.execute({ item })

    await this.sync.sync()

    return this.items.findSureItem(item.uuid)
  }

  async deleteGroup(groupUuid: string): Promise<boolean> {
    const useCase = new DeleteGroupUseCase(this.items, this.groupsServer)
    const error = await useCase.execute({ groupUuid })

    if (isClientDisplayableError(error)) {
      return false
    }

    await this.sync.sync()
    return true
  }

  async removeUserFromGroup(groupUuid: string, memberUuid: string): Promise<ClientDisplayableError | void> {
    const useCase = new RemoveGroupMemberUseCase(this.groupUsersServer)
    const result = await useCase.execute({ groupUuid, memberUuid })

    if (isClientDisplayableError(result)) {
      return result
    }

    await this.rotateGroupKey(groupUuid)
  }

  async getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined> {
    const useCase = new GetGroupUsersUseCase(this.groupUsersServer)
    return useCase.execute({ groupUuid })
  }

  getGroupKey(groupUuid: string): GroupKeyInterface | undefined {
    return this.encryption.getGroupKey(groupUuid)
  }

  getGroupInfoForItem(item: DecryptedItemInterface): GroupKeyContentSpecialized | undefined {
    if (!item.group_uuid) {
      return undefined
    }

    return this.getGroupInfo(item.group_uuid)
  }

  getGroupInfo(groupUuid: string): GroupKeyContentSpecialized | undefined {
    return this.getGroupKey(groupUuid)?.content
  }

  async updateGroup(
    groupUuid: string,
    params: { specifiedItemsKeyUuid: string; groupKeyTimestamp: number },
  ): Promise<GroupServerHash | ClientDisplayableError> {
    const updateGroupUseCase = new UpdateGroupUseCase(this.groupsServer)

    return updateGroupUseCase.execute({
      groupUuid: groupUuid,
      groupKeyTimestamp: params.groupKeyTimestamp,
      specifiedItemsKeyUuid: params.specifiedItemsKeyUuid,
    })
  }

  async changeGroupMetadata(
    groupUuid: string,
    params: { name: string; description: string },
  ): Promise<ClientDisplayableError[] | undefined> {
    const changeGroupMetadataUseCase = new ChangeGroupMetadataUsecase(
      this.items,
      this.encryption,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
    )

    const result = await changeGroupMetadataUseCase.execute({
      groupUuid,
      groupName: params.name,
      groupDescription: params.description,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })

    if (!result || result.length === 0) {
      await this.sync.sync()
    }

    return result
  }

  async rotateGroupKey(groupUuid: string): Promise<void> {
    const useCase = new RotateGroupKeyUseCase(
      this.items,
      this.encryption,
      this.groupsServer,
      this.groupInvitesServer,
      this.groupUsersServer,
      this.contacts,
      this.groupStorage,
    )

    await useCase.execute({
      groupUuid,
      inviterUuid: this.user.uuid,
      inviterPrivateKey: this.userDecryptedPrivateKey,
      inviterPublicKey: this.userPublicKey,
    })

    await this.sync.sync()
  }

  isItemInCollaborativeGroup(item: DecryptedItemInterface): boolean {
    return item.group_uuid !== undefined
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

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.groupsServer as unknown) = undefined
    ;(this.contacts as unknown) = undefined
    this.syncEventDisposer()
    this.itemsEventDisposer()
  }
}
