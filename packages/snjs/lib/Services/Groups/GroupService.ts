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
  SyncEvent,
  SyncServiceInterface,
} from '@standardnotes/services'
import { ContactContent, ContactInterface, DecryptedItemInterface, FillItemContent } from '@standardnotes/models'
import { GroupServiceEvent, GroupServiceInterface } from './GroupServiceInterface'
import { EncryptionProviderInterface, GroupKey, GroupKeyInterface } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'

export class GroupService extends AbstractService<GroupServiceEvent> implements GroupServiceInterface {
  private groupsServer: GroupsServerInterface
  private syncEventDisposer: () => void

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
    this.syncEventDisposer = sync.addEventObserver((event, data) => {
      if (event === SyncEvent.ReceivedGroupKeys) {
        const groupKeys = data as GroupKeyInterface[]
        const groupIds = groupKeys.map((groupKey) => groupKey.groupUuid)

        void this.syncGroupsFromScratch(groupIds)
      }
    })
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

  async createContact(params: {
    name: string
    publicKey: string
    userUuid: string
    trusted: boolean
  }): Promise<ContactInterface> {
    const content: ContactContent = FillItemContent<ContactContent>({
      name: params.name,
      publicKey: params.publicKey,
      userUuid: params.userUuid,
      trusted: params.trusted,
    })
    const contactTemplate = this.items.createTemplateItem<ContactContent, ContactInterface>(
      ContentType.Contact,
      content,
    )

    const contact = await this.items.insertItem<ContactInterface>(contactTemplate)

    return contact
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

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.encryption as unknown) = undefined
    ;(this.items as unknown) = undefined
    ;(this.session as unknown) = undefined
    ;(this.groupsServer as unknown) = undefined
    this.syncEventDisposer()
  }
}
