import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import {
  HttpServiceInterface,
  GroupsServer,
  GroupsServerInterface,
  GroupInterface,
  GroupUserInterface,
  GroupPermission,
} from '@standardnotes/api'
import {
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SessionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'
import { GroupsServiceEvent, GroupsServiceInterface } from './GroupsServiceInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class GroupsService extends AbstractService<GroupsServiceEvent> implements GroupsServiceInterface {
  private groupsServer: GroupsServerInterface
  private user!: { publicKey: string; privateKey: string }

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.groupsServer = new GroupsServer(http)
  }

  async createGroup(): Promise<GroupInterface | ClientDisplayableError> {
    const response = await this.groupsServer.createGroup()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const groupUuid = response.data.uuid
    const groupKey = this.encryption.createGroupKey(groupUuid)
    await this.items.insertItem(groupKey)

    const sharedItemsKey = this.encryption.createSharedItemsKey(groupUuid)
    await this.items.insertItem(sharedItemsKey)

    void this.sync.sync()

    return response.data
  }

  async getUserGroups(): Promise<GroupInterface[] | ClientDisplayableError> {
    const response = await this.groupsServer.getUserGroups()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data
  }

  async addContactToGroup(
    group: GroupInterface,
    contact: Contact,
    permissions: GroupPermission,
  ): Promise<GroupUserInterface | ClientDisplayableError> {
    const groupKey = this.items.groupKeyForGroup(group.uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      groupKey,
      this.user.privateKey,
      contact.publicKey,
    )

    const response = await this.groupsServer.addUserToGroup(
      group.uuid,
      contact.userUuid,
      encryptedGroupKey,
      permissions,
    )

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data
  }

  async addItemToGroup(group: GroupInterface, item: DecryptedItemInterface): Promise<void> {
    await this.items.changeItem(item, (mutator) => {
      mutator.group_uuid = group.uuid
    })
    void this.sync.sync()
  }

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.user as unknown) = undefined
    ;(this.groupsServer as unknown) = undefined
  }
}
