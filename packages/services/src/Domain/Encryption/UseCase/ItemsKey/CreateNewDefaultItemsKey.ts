import { EncryptionOperatorsInterface } from '@standardnotes/encryption'
import { ProtocolVersionLastNonrootItemsKey, ProtocolVersionLatest, compareVersions } from '@standardnotes/common'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  FillItemContentSpecialized,
  ItemsKeyContent,
  ItemsKeyContentSpecialized,
  ItemsKeyInterface,
  PayloadTimestampDefaults,
} from '@standardnotes/models'
import { UuidGenerator } from '@standardnotes/utils'
import { MutatorClientInterface } from '../../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from '../../../Item/ItemManagerInterface'
import { RootKeyManager } from '../../../RootKeyManager/RootKeyManager'
import { ContentType } from '@standardnotes/domain-core'

/**
 * Creates a new random items key to use for item encryption, and adds it to model management.
 * Consumer must call sync. If the protocol version <= 003, only one items key should be created,
 * and its .itemsKey value should be equal to the root key masterKey value.
 */
export class CreateNewDefaultItemsKey {
  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private operators: EncryptionOperatorsInterface,
    private rootKeyManager: RootKeyManager,
  ) {}

  async execute(): Promise<ItemsKeyInterface> {
    const rootKey = this.rootKeyManager.getSureRootKey()
    const operatorVersion = rootKey ? rootKey.keyVersion : ProtocolVersionLatest
    let itemTemplate: ItemsKeyInterface

    if (compareVersions(operatorVersion, ProtocolVersionLastNonrootItemsKey) <= 0) {
      /** Create root key based items key */
      const payload = new DecryptedPayload<ItemsKeyContent>({
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.TYPES.ItemsKey,
        content: FillItemContentSpecialized<ItemsKeyContentSpecialized, ItemsKeyContent>({
          itemsKey: rootKey.masterKey,
          dataAuthenticationKey: rootKey.dataAuthenticationKey,
          version: operatorVersion,
        }),
        ...PayloadTimestampDefaults(),
      })
      itemTemplate = CreateDecryptedItemFromPayload(payload)
    } else {
      /** Create independent items key */
      itemTemplate = this.operators.operatorForVersion(operatorVersion).createItemsKey()
    }

    const itemsKeys = this.items.getDisplayableItemsKeys()
    const defaultKeys = itemsKeys.filter((key) => {
      return key.isDefault
    })

    for (const key of defaultKeys) {
      await this.mutator.changeItemsKey(key, (mutator) => {
        mutator.isDefault = false
      })
    }

    const itemsKey = await this.mutator.insertItem<ItemsKeyInterface>(itemTemplate)
    await this.mutator.changeItemsKey(itemsKey, (mutator) => {
      mutator.isDefault = true
    })

    return itemsKey
  }
}
