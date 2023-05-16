import {
  ClientDisplayableError,
  GroupUserKeyServerHash,
  GroupServerHash,
  User,
  isErrorResponse,
} from '@standardnotes/responses'
import { HttpServiceInterface, GroupsServer, GroupsServerInterface, GroupPermission } from '@standardnotes/api'
import {
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SessionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/services'
import { Contact, DecryptedItemInterface } from '@standardnotes/models'
import { GroupsServiceEvent, GroupsServiceInterface } from './GroupsServiceInterface'
import { EncryptionProviderInterface, GroupKey } from '@standardnotes/encryption'

export class GroupsService extends AbstractService<GroupsServiceEvent> implements GroupsServiceInterface {
  private groupsServer: GroupsServerInterface

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

  get decryptedPrivateKey(): string {
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
      this.decryptedPrivateKey,
      this.userPublicKey,
    )

    const response = await this.groupsServer.createGroup({
      creatorPublicKey: this.userPublicKey,
      encryptedGroupKey: encryptedGroupKey,
    })

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const { group, userKey } = response.data

    const groupUuid = group.uuid
    const groupKey = new GroupKey({
      uuid: userKey.uuid,
      groupUuid: group.uuid,
      key: key,
      updatedAtTimestamp: userKey.updated_at_timestamp,
      senderPublicKey: userKey.sender_public_key,
      keyVersion: version,
    })
    this.encryption.persistGroupKey(groupKey)

    const sharedItemsKey = this.encryption.createSharedItemsKey(groupUuid)
    await this.items.insertItem(sharedItemsKey)

    void this.sync.sync()

    return group
  }

  async addContactToGroup(
    group: GroupServerHash,
    contact: Contact,
    permissions: GroupPermission,
  ): Promise<GroupUserKeyServerHash | ClientDisplayableError> {
    const groupKey = this.encryption.getGroupKey(group.uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      groupKey.key,
      this.decryptedPrivateKey,
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

  async addItemToGroup(group: GroupServerHash, item: DecryptedItemInterface): Promise<void> {
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
