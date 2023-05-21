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
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SessionsClientInterface,
  SyncEvent,
  SyncServiceInterface,
  ContactServiceInterface,
  SyncEventReceivedGroupKeysData,
  InternalEventHandlerInterface,
  InternalEventInterface,
  GroupStorageServiceInterface,
} from '@standardnotes/services'
import { DecryptedItemInterface, PayloadEmitSource, TrustedContactInterface } from '@standardnotes/models'
import { GroupServiceEvent, GroupServiceInterface } from './GroupServiceInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { HandleSuccessfullyChangedCredentials } from './UseCase/HandleSuccessfullyChangedCredentials'
import { SessionEvent } from '../Session/SessionEvent'
import { SuccessfullyChangedCredentialsEventData } from '../Session/SuccessfullyChangedCredentialsEventData'
import { AcceptInvites } from './UseCase/AcceptInvites'
import { CreateGroupUseCase } from './UseCase/CreateGroup'
import { RotateGroupKeyUseCase } from './UseCase/RotateGroupKey'
import { GetGroupUsersUseCase } from './UseCase/GetGroupUsers'

export class GroupService
  extends AbstractService<GroupServiceEvent>
  implements GroupServiceInterface, InternalEventHandlerInterface
{
  private groupsServer: GroupsServerInterface
  private groupUsersServer: GroupUsersServerInterface
  private groupInvitesServer: GroupInvitesServerInterface

  private syncEventDisposer: () => void
  private itemsEventDisposer: () => void

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
      if (event === SyncEvent.ReceivedGroupKeys) {
        await this.handleInboundInvites(data as SyncEventReceivedGroupKeysData)
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

  /**
   * When new contacts are trusted, we want to go back out to the server and retrieve any pending
   * invites from this user, so that we can now decrypt that information given we trust the contact.
   */
  private async handleCreationOfNewTrustedContacts(_contacts: TrustedContactInterface[]): Promise<void> {
    const response = await this.groupInvitesServer.getInboundUserInvites()

    if (isErrorResponse(response)) {
      console.error('Failed to get inbound user invites', response)
      return
    }

    await this.handleInboundInvites(response.data.invites)
  }

  private async handleInboundInvites(invites: GroupInviteServerHash[]): Promise<void> {
    const { trusted, untrusted } = this.filterInboundInvites(invites)

    const handler = new AcceptInvites(
      this.userDecryptedPrivateKey,
      this.groupInvitesServer,
      this.items,
      this.encryption,
    )
    const { inserted, changed } = await handler.execute(trusted)
    const changedAndInserted = [...inserted, ...changed]
    if (changedAndInserted.length > 0) {
      await this.sync.sync()
    }

    for (const key of changedAndInserted) {
      await this.decryptErroredItemsForGroup(key.groupUuid)
    }

    await this.notifyEventSync(GroupServiceEvent.DidResolveRemoteGroupInvites)

    const groupIdsNeedingSyncFromScratch = inserted.map((groupKey) => groupKey.groupUuid)
    void this.syncGroupsFromScratch(groupIdsNeedingSyncFromScratch)

    if (untrusted.length > 0) {
      await this.promptUserForUntrustedInvites(untrusted)
    }
  }

  private filterInboundInvites(invites: GroupInviteServerHash[]): {
    trusted: GroupInviteServerHash[]
    untrusted: GroupInviteServerHash[]
  } {
    const untrusted: GroupInviteServerHash[] = []
    const trusted: GroupInviteServerHash[] = []

    for (const invite of invites) {
      const trustedContact = this.contacts.findTrustedContact(invite.inviter_uuid)
      if (!trustedContact || trustedContact.contactPublicKey !== invite.inviter_public_key) {
        untrusted.push(invite)
        continue
      }

      trusted.push(invite)
    }

    return { trusted, untrusted }
  }

  private async decryptErroredItemsForGroup(_groupUuid: string): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async promptUserForUntrustedInvites(untrusted: GroupInviteServerHash[]): Promise<void> {
    console.error('promptUserForUntrustedInvites', untrusted)
  }

  private async syncGroupsFromScratch(groupUuids: string[]): Promise<void> {
    if (groupUuids.length === 0) {
      return
    }

    await this.sync.syncGroupsFromScratch(groupUuids)
  }

  get user(): User {
    return this.session.getSureUser()
  }

  get userPublicKey(): string {
    const key = this.user.publicKey
    if (!key) {
      throw new Error('User public key not found')
    }

    return key
  }

  get userDecryptedPrivateKey(): string {
    const key = this.encryption.getDecryptedPrivateKey()
    if (!key) {
      throw new Error('Decrypted private key not found')
    }

    return key
  }

  async createGroup(): Promise<GroupServerHash | ClientDisplayableError> {
    const createGroup = new CreateGroupUseCase(this.items, this.groupsServer, this.encryption)
    const result = await createGroup.execute()

    if (!isClientDisplayableError(result)) {
      await this.sync.sync()
    }

    await this.sync.sync()

    return result
  }

  async addContactToGroup(
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
    await this.items.changeItem(item, (mutator) => {
      mutator.group_uuid = group.uuid
    })

    await this.sync.sync()

    return this.items.findSureItem(item.uuid)
  }

  async deleteGroup(groupUuid: string): Promise<boolean> {
    const response = await this.groupsServer.deleteGroup({ groupUuid })

    if (isErrorResponse(response)) {
      return false
    }

    return true
  }

  async removeUserFromGroup(groupUuid: string, userUuid: string): Promise<boolean> {
    const response = await this.groupUsersServer.deleteGroupUser({ groupUuid, userUuid })

    if (isErrorResponse(response)) {
      return false
    }

    return true
  }

  async getGroupUsers(groupUuid: string): Promise<GroupUserServerHash[] | undefined> {
    const useCase = new GetGroupUsersUseCase(this.groupUsersServer)

    return useCase.execute({ groupUuid })
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
