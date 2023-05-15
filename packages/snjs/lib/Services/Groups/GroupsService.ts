import { GroupKeyContentSpecialized } from '@standardnotes/models/src/Domain/Syncable/GroupKey/GroupKeyContent'
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
import { Contact, DecryptedItemInterface, GroupKeyInterface, GroupKeyMutator } from '@standardnotes/models'
import { GroupsServiceEvent, GroupsServiceInterface } from './GroupsServiceInterface'
import { ContentType } from '@standardnotes/common'
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

    const groupKey = this.encryption.createGroupKey(response.data.uuid)
    await this.items.insertItem(groupKey)

    const sharedItemsKey = this.encryption.createSharedItemsKey()
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
    const groupKey = this.findGroupKeyForGroup(group)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.operator.asymmetricEncryptKey(groupKey.key, this.user.privateKey, contact.publicKey)

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

  async addItemToGroup(
    group: GroupInterface,
    item: DecryptedItemInterface,
  ): Promise<undefined | ClientDisplayableError> {
    const groupKey = this.findGroupKeyForGroup(group)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const response = await this.groupsServer.addItemToGroup(item.uuid, group.uuid)

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    await this.items.changeItem<GroupKeyMutator>(groupKey, (mutator) => {
      mutator.addItemReference(item)
    })

    void this.sync.sync()

    return undefined
  }

  private findGroupKeyForGroup(group: GroupInterface): GroupKeyInterface | undefined {
    const allGroupKeys = this.items.getItems<GroupKeyInterface>(ContentType.GroupKey)
    return allGroupKeys.find((groupKey) => groupKey.groupUuid === group.uuid)
  }

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.operator as unknown) = undefined
    ;(this.groupsServer as unknown) = undefined
  }
}
