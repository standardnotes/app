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
  UpdateKeysRequestParam,
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
} from '@standardnotes/services'
import { DecryptedItemInterface, PayloadEmitSource, TrustedContactInterface } from '@standardnotes/models'
import { GroupServiceEvent, GroupServiceInterface } from './GroupServiceInterface'
import { EncryptionProviderInterface, GroupKey } from '@standardnotes/encryption'
import { ContentType } from '@standardnotes/common'
import { SessionEvent, SuccessfullyChangedCredentialsEventData } from '../Api'

export class GroupService
  extends AbstractService<GroupServiceEvent>
  implements GroupServiceInterface, InternalEventHandlerInterface
{
  private groupsServer: GroupsServerInterface
  private syncEventDisposer: () => void
  private itemsEventDisposer: () => void

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
    eventBus.addEventHandler(this, SessionEvent.SuccessfullyChangedCredentials)

    this.groupsServer = new GroupsServer(http)
    this.syncEventDisposer = sync.addEventObserver(async (event, data) => {
      if (event === SyncEvent.ReceivedGroupKeys) {
        await this.handleRemoteReceivedGroupKeys(data as SyncEventReceivedGroupKeysData)
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
      await this.handleSuccessfullyChangedCredentialsEvent(event.payload as SuccessfullyChangedCredentialsEventData)
    }
  }

  /**
   * When the local client initiates a change of credentials, it is also responsible for reencrypting all user
   * group keys that are addressed to the current user, and that the current user has addressed for others.
   */
  private async handleSuccessfullyChangedCredentialsEvent(
    data: SuccessfullyChangedCredentialsEventData,
  ): Promise<void> {
    const { previousPublicKey, previousPrivateKey, newPublicKey, newPrivateKey } = data

    const getAllUserKeysResponse = await this.groupsServer.getAllUserKeysForCurrentUser()
    if (isErrorResponse(getAllUserKeysResponse)) {
      console.error('Failed to get all user keys for current user')
      return
    }

    const updatedValues: UpdateKeysRequestParam = []

    const allUserKeys = getAllUserKeysResponse.data.groupUserKeys
    for (const userKey of allUserKeys) {
      const userKeyType = userKey.user_uuid === this.user.uuid ? 'recipient' : 'sender'
      const isEncryptedWithNewPublicKey = userKey.recipient_public_key === newPublicKey
      if (isEncryptedWithNewPublicKey) {
        continue
      }

      const isEncryptedWithPreviousPublicKey = userKey.recipient_public_key === previousPublicKey
      if (!isEncryptedWithPreviousPublicKey || !previousPrivateKey) {
        console.error('User key is not encrypted with either current or previous public key', userKey)
        continue
      }

      const decryptedGroupKey = this.encryption.decryptGroupKeyWithPrivateKey(
        userKey.encrypted_group_key,
        userKey.inviter_public_key,
        previousPrivateKey,
      )

      if (!decryptedGroupKey) {
        console.error('Failed to decrypt group key', userKey)
        continue
      }

      const publicKeyToUse = userKeyType === 'recipient' ? newPublicKey : userKey.recipient_public_key

      const newEncryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
        decryptedGroupKey,
        newPrivateKey,
        publicKeyToUse,
      )

      updatedValues.push({
        userUuid: userKey.user_uuid,
        senderPublicKey: newPublicKey,
        recipientPublicKey: ,
        encryptedGroupKey,
      })
    }
  }

  /**
   * When new contacts are trusted, we want to go back out to the server and retrieve any pending
   * invitations and keys from this user, so that we can now decrypt that information given we trust the contact.
   */
  private async handleCreationOfNewTrustedContacts(contacts: TrustedContactInterface[]): Promise<void> {
    for (const contact of contacts) {
      const response = await this.groupsServer.getReceivedUserKeysBySender({ senderUuid: contact.contactUserUuid })

      if (isErrorResponse(response)) {
        console.error('Failed to get received user keys by sender', contact.contactUserUuid, response)
        continue
      }

      const { groupUserKeys } = response.data

      await this.handleRemoteReceivedGroupKeys(groupUserKeys)
    }
  }

  private async handleRemoteReceivedGroupKeys(incomingUserKeys: GroupUserKeyServerHash[]): Promise<void> {
    const untrusted: GroupUserKeyServerHash[] = []
    const trusted: GroupUserKeyServerHash[] = []

    for (const userKey of incomingUserKeys) {
      const isSenderTrustedSelf =
        userKey.sender_uuid === this.user.uuid && userKey.inviter_public_key === this.userPublicKey
      if (isSenderTrustedSelf) {
        trusted.push(userKey)
        continue
      }

      const trustedContact = this.contacts.findContact(userKey.sender_uuid)
      if (!trustedContact || trustedContact.publicKey !== userKey.inviter_public_key) {
        untrusted.push(userKey)
        continue
      }

      trusted.push(userKey)
    }

    const { inserted, changed } = await this.encryption.persistTrustedRemoteRetrievedGroupKeys(trusted)
    for (const key of [...inserted, ...changed]) {
      await this.decryptErroredItemsForGroup(key.groupUuid)
    }

    await this.notifyEventSync(GroupServiceEvent.DidResolveRemoteGroupUserKeys)

    const groupIdsNeedingSyncFromScratch = inserted.map((groupKey) => groupKey.groupUuid)
    void this.syncGroupsFromScratch(groupIdsNeedingSyncFromScratch)

    if (untrusted.length > 0) {
      await this.promptUserForUntrustedUserKeys(untrusted)
    }
  }

  private async decryptErroredItemsForGroup(_groupUuid: string): Promise<void> {
    await this.encryption.decryptErroredPayloads()
  }

  private async promptUserForUntrustedUserKeys(untrusted: GroupUserKeyServerHash[]): Promise<void> {
    console.error('promptUserForUntrustedUserKeys', untrusted)
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
      senderPublicKey: groupUserKey.inviter_public_key,
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
    contact: TrustedContactInterface,
    permissions: GroupPermission,
  ): Promise<GroupUserKeyServerHash | ClientDisplayableError> {
    const groupKey = this.encryption.getGroupKey(group.uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
      groupKey.key,
      this.userDecryptedPrivateKey,
      contact.contactPublicKey,
    )

    const response = await this.groupsServer.inviteUserToGroup({
      groupUuid: group.uuid,
      inviteeUuid: contact.contactUserUuid,
      senderPublicKey: this.userPublicKey,
      recipientPublicKey: contact.contactPublicKey,
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
        senderPublicKey: this.userPublicKey,
        recipientPublicKey: contact.publicKey,
        encryptedGroupKey,
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
    this.itemsEventDisposer()
  }
}
