import {
  ClientDisplayableError,
  GroupUserKeyServerHash,
  GroupServerHash,
  User,
  isErrorResponse,
  GroupUserListingServerHash,
} from '@standardnotes/responses'
import {
  HttpServiceInterface,
  GroupsServer,
  GroupsServerInterface,
  GroupPermission,
  UpdateKeysForGroupMembersKeysParam,
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
} from '@standardnotes/services'
import { ContactInterface, DecryptedItemInterface } from '@standardnotes/models'
import { GroupServiceEvent, GroupServiceInterface } from './GroupServiceInterface'
import { EncryptionProviderInterface, GroupKey } from '@standardnotes/encryption'

export class GroupService extends AbstractService<GroupServiceEvent> implements GroupServiceInterface {
  private groupsServer: GroupsServerInterface
  private syncEventDisposer: () => void

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    private encryption: EncryptionProviderInterface,
    private session: SessionsClientInterface,
    private contacts: ContactServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.groupsServer = new GroupsServer(http)
    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedGroupKeys) {
        await this.handleReceivedGroupKeysSyncEvent(data as SyncEventReceivedGroupKeysData)
      }
    })
  }

  private async handleReceivedGroupKeysSyncEvent(data: SyncEventReceivedGroupKeysData): Promise<void> {
    const incomingUserKeys = data as SyncEventReceivedGroupKeysData

    const untrusted: GroupUserKeyServerHash[] = []
    const trusted: GroupUserKeyServerHash[] = []

    for (const userKey of incomingUserKeys) {
      const isSenderTrustedSelf =
        userKey.sender_uuid === this.user.uuid && userKey.sender_public_key === this.userPublicKey
      if (isSenderTrustedSelf) {
        trusted.push(userKey)
        continue
      }

      const contact = this.contacts.findContact(userKey.sender_uuid)
      if (!contact || contact.publicKey !== userKey.sender_public_key) {
        untrusted.push(userKey)
        continue
      }

      trusted.push(userKey)
    }

    await this.encryption.persistTrustedRemoteRetrievedGroupKeys(trusted)

    const groupIdsNeedingSync = trusted.map((groupKey) => groupKey.group_uuid)
    void this.syncGroupsFromScratch(groupIdsNeedingSync)

    if (untrusted.length > 0) {
      void this.promptUserForUntrustedUserKeys(untrusted)
    }
  }

  private async promptUserForUntrustedUserKeys(_untrusted: GroupUserKeyServerHash[]): Promise<void> {
    throw new Error('Method promptUserForUntrustedUserKeys not implemented')
  }

  private async syncGroupsFromScratch(groupUuids: string[]): Promise<void> {
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
    const { key, version } = this.encryption.createGroupKeyString()
    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      key,
      this.userDecryptedPrivateKey,
      this.userPublicKey,
    )

    const response = await this.groupsServer.createGroup({
      creatorPublicKey: this.userPublicKey,
      encryptedGroupKey: encryptedGroupKey,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { group, groupUserKey } = response.data

    const groupUuid = group.uuid
    const groupKey = new GroupKey({
      uuid: groupUserKey.uuid,
      groupUuid: group.uuid,
      key: key,
      updatedAtTimestamp: groupUserKey.updated_at_timestamp,
      senderPublicKey: groupUserKey.sender_public_key,
      keyVersion: version,
    })
    this.encryption.persistGroupKey(groupKey)

    const sharedItemsKey = this.encryption.createSharedItemsKey(groupUuid)
    await this.items.insertItem(sharedItemsKey)

    await this.sync.sync()

    return group
  }

  async addContactToGroup(
    group: GroupServerHash,
    contact: ContactInterface,
    permissions: GroupPermission,
  ): Promise<GroupUserKeyServerHash | ClientDisplayableError> {
    const groupKey = this.encryption.getGroupKey(group.uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      groupKey.key,
      this.userDecryptedPrivateKey,
      contact.publicKey,
    )

    const response = await this.groupsServer.addUserToGroup({
      groupUuid: group.uuid,
      inviteeUuid: contact.userUuid,
      senderPublicKey: this.userPublicKey,
      encryptedGroupKey,
      permissions,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    return response.data.groupUserKey
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
    const response = await this.groupsServer.removeUserFromGroup({ groupUuid, userUuid })

    if (isErrorResponse(response)) {
      return false
    }

    return true
  }

  async getGroupUsers(groupUuid: string): Promise<GroupUserListingServerHash[] | undefined> {
    const response = await this.groupsServer.getGroupUsers({ groupUuid })

    if (isErrorResponse(response)) {
      return undefined
    }

    return response.data.users
  }

  async rotateGroupKey(groupUuid: string): Promise<void> {
    const users = await this.getGroupUsers(groupUuid)
    if (!users) {
      throw new Error('Cannot rotate group key; users not found')
    }

    if (users.length === 0) {
      return
    }

    const { key, version } = this.encryption.createGroupKeyString()

    const updatedKeys: UpdateKeysForGroupMembersKeysParam = []

    for (const user of users) {
      if (user.user_uuid === this.user.uuid) {
        continue
      }

      const contact = this.contacts.findContact(user.user_uuid)
      if (!contact) {
        throw new Error('Cannot rotate group key; contact not found')
      }

      const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
        key,
        this.userDecryptedPrivateKey,
        contact.publicKey,
      )

      updatedKeys.push({
        userUuid: user.user_uuid,
        encryptedGroupKey,
        senderKeypairId: this.userKeypairId,
        senderPublicKey: this.userPublicKey,
      })
    }

    const groupKey = this.encryption.getGroupKey(groupUuid)
    if (!groupKey) {
      throw new Error('Cannot rotate group key; group key not found')
    }

    const updatedGroupKey = new GroupKey({
      ...groupKey,
      key: key,
      keyVersion: version,
    })

    this.encryption.persistGroupKey(updatedGroupKey)

    await this.encryption.reencryptSharedItemsKeysForGroup(groupUuid)

    await this.groupsServer.updateKeysForAllGroupMembers({
      groupUuid,
      updatedKeys,
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
  }
}
