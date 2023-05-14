import { GroupKeyContentSpecialized } from './../../../../models/src/Domain/Syncable/GroupKey/GroupKeyContent'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import {
  HttpServiceInterface,
  SharingServer,
  SharingServerInterface,
  ShareGroupInterface,
  ShareGroupUserInterface,
  ShareGroupPermission,
  ShareGroupItemInterface,
} from '@standardnotes/api'
import { ProtocolOperator005 } from '@standardnotes/encryption'
import {
  AbstractService,
  InternalEventBusInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  UserClientInterface,
} from '@standardnotes/services'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  Contact,
  DecryptedItemInterface,
  FillItemContentSpecialized,
  GroupKeyInterface,
  GroupKeyMutator,
} from '@standardnotes/models'
import { SharingServiceEvent, SharingServiceInterface } from './SharingServiceInterface'
import { ContentType } from '@standardnotes/common'

export class SharingService extends AbstractService<SharingServiceEvent> implements SharingServiceInterface {
  private operator: ProtocolOperator005
  private sharingServer: SharingServerInterface
  private user: { publicKey: string; privateKey: string }

  constructor(
    private http: HttpServiceInterface,
    private sync: SyncServiceInterface,
    private items: ItemManagerInterface,
    user: UserClientInterface,
    private crypto: PureCryptoInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
    this.sharingServer = new SharingServer(http)
    this.operator = new ProtocolOperator005(crypto)
  }

  async createShareGroup(): Promise<ShareGroupInterface | ClientDisplayableError> {
    const response = await this.sharingServer.createShareGroup()

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    const groupKeyContent: GroupKeyContentSpecialized = {
      groupUuid: response.data.uuid,
      key: this.crypto.generateRandomKey(192),
      version: this.operator.version,
    }

    await this.items.createItem<GroupKeyInterface>(
      ContentType.GroupKey,
      FillItemContentSpecialized(groupKeyContent),
      true,
    )

    const sharedItemsKey = this.operator.createSharedItemsKey()
    await this.items.insertItem(sharedItemsKey)

    void this.sync.sync()

    return response.data
  }

  async addContactToShareGroup(
    group: ShareGroupInterface,
    contact: Contact,
    permissions: ShareGroupPermission,
  ): Promise<ShareGroupUserInterface | ClientDisplayableError> {
    const groupKey = this.findGroupKeyForGroup(group)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const encryptedGroupKey = this.operator.asymmetricEncryptKey(groupKey.key, this.user.privateKey, contact.publicKey)

    const response = await this.sharingServer.addUserToShareGroup(
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

  async addItemToShareGroup(
    group: ShareGroupInterface,
    item: DecryptedItemInterface,
  ): Promise<ShareGroupItemInterface | ClientDisplayableError> {
    const groupKey = this.findGroupKeyForGroup(group)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Cannot add contact; group key not found')
    }

    const response = await this.sharingServer.addItemToShareGroup(item.uuid, group.uuid)

    if (isErrorResponse(response)) {
      return ClientDisplayableError.FromError(response.data.error)
    }

    await this.items.changeItem<GroupKeyMutator>(groupKey, (mutator) => {
      mutator.addItemReference(item)
    })

    void this.sync.sync()

    return response.data
  }

  private findGroupKeyForGroup(group: ShareGroupInterface): GroupKeyInterface | undefined {
    const allGroupKeys = this.items.getItems<GroupKeyInterface>(ContentType.GroupKey)
    return allGroupKeys.find((groupKey) => groupKey.groupUuid === group.uuid)
  }

  override deinit(): void {
    super.deinit()
    ;(this.http as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.operator as unknown) = undefined
    ;(this.sharingServer as unknown) = undefined
  }
}
