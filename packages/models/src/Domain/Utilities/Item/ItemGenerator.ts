import { EncryptedItem } from '../../Abstract/Item/Implementations/EncryptedItem'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { FileItem } from '../../Syncable/File/File'
import { SNFeatureRepo } from '../../Syncable/FeatureRepo/FeatureRepo'
import { SNActionsExtension } from '../../Syncable/ActionsExtension/ActionsExtension'
import { ComponentItem } from '../../Syncable/Component/Component'
import { SNEditor } from '../../Syncable/Editor/Editor'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { SNNote } from '../../Syncable/Note/Note'
import { SmartView } from '../../Syncable/SmartView/SmartView'
import { SNTag } from '../../Syncable/Tag/Tag'
import { SNUserPrefs } from '../../Syncable/UserPrefs/UserPrefs'
import { FileMutator } from '../../Syncable/File/FileMutator'
import { MutationType } from '../../Abstract/Item/Types/MutationType'
import { UserPrefsMutator } from '../../Syncable/UserPrefs/UserPrefsMutator'
import { ActionsExtensionMutator } from '../../Syncable/ActionsExtension/ActionsExtensionMutator'
import { ComponentMutator } from '../../Syncable/Component/ComponentMutator'
import { TagMutator } from '../../Syncable/Tag/TagMutator'
import { NoteMutator } from '../../Syncable/Note/NoteMutator'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { DeletedItem } from '../../Abstract/Item/Implementations/DeletedItem'
import { EncryptedItemInterface } from '../../Abstract/Item/Interfaces/EncryptedItem'
import { DeletedItemInterface } from '../../Abstract/Item/Interfaces/DeletedItem'
import { SmartViewMutator } from '../../Syncable/SmartView'
import { TrustedContact } from '../../Syncable/TrustedContact/TrustedContact'
import { TrustedContactMutator } from '../../Syncable/TrustedContact/Mutator/TrustedContactMutator'
import { KeySystemRootKey } from '../../Syncable/KeySystemRootKey/KeySystemRootKey'
import { KeySystemRootKeyMutator } from '../../Syncable/KeySystemRootKey/KeySystemRootKeyMutator'
import { VaultListing } from '../../Syncable/VaultListing/VaultListing'
import { VaultListingMutator } from '../../Syncable/VaultListing/VaultListingMutator'
import {
  DeletedPayloadInterface,
  EncryptedPayloadInterface,
  isDecryptedPayload,
  isDeletedPayload,
  isEncryptedPayload,
} from '../../Abstract/Payload'
import { ContentType } from '@standardnotes/domain-core'

type ItemClass<C extends ItemContent = ItemContent> = new (payload: DecryptedPayloadInterface<C>) => DecryptedItem<C>

type MutatorClass<C extends ItemContent = ItemContent> = new (
  item: DecryptedItemInterface<C>,
  type: MutationType,
) => DecryptedItemMutator<C>

type MappingEntry<C extends ItemContent = ItemContent> = {
  itemClass: ItemClass<C>
  mutatorClass?: MutatorClass<C>
}

const ContentTypeClassMapping: Partial<Record<string, MappingEntry>> = {
  [ContentType.TYPES.ActionsExtension]: {
    itemClass: SNActionsExtension,
    mutatorClass: ActionsExtensionMutator,
  },
  [ContentType.TYPES.Component]: { itemClass: ComponentItem, mutatorClass: ComponentMutator },
  [ContentType.TYPES.KeySystemRootKey]: { itemClass: KeySystemRootKey, mutatorClass: KeySystemRootKeyMutator },
  [ContentType.TYPES.TrustedContact]: { itemClass: TrustedContact, mutatorClass: TrustedContactMutator },
  [ContentType.TYPES.VaultListing]: { itemClass: VaultListing, mutatorClass: VaultListingMutator },
  [ContentType.TYPES.Editor]: { itemClass: SNEditor },
  [ContentType.TYPES.ExtensionRepo]: { itemClass: SNFeatureRepo },
  [ContentType.TYPES.File]: { itemClass: FileItem, mutatorClass: FileMutator },
  [ContentType.TYPES.Note]: { itemClass: SNNote, mutatorClass: NoteMutator },
  [ContentType.TYPES.SmartView]: { itemClass: SmartView, mutatorClass: SmartViewMutator },
  [ContentType.TYPES.Tag]: { itemClass: SNTag, mutatorClass: TagMutator },
  [ContentType.TYPES.Theme]: { itemClass: ComponentItem, mutatorClass: ComponentMutator },
  [ContentType.TYPES.UserPrefs]: { itemClass: SNUserPrefs, mutatorClass: UserPrefsMutator },
} as unknown as Partial<Record<string, MappingEntry>>

export function CreateDecryptedMutatorForItem<
  I extends DecryptedItemInterface,
  M extends DecryptedItemMutator<ItemContent, I> = DecryptedItemMutator<ItemContent, I>,
>(item: I, type: MutationType): M {
  const lookupValue = ContentTypeClassMapping[item.content_type]?.mutatorClass
  if (lookupValue) {
    return new lookupValue(item, type) as M
  } else {
    return new DecryptedItemMutator<ItemContent, I>(item, type) as M
  }
}

export function RegisterItemClass<
  C extends ItemContent = ItemContent,
  M extends DecryptedItemMutator<C> = DecryptedItemMutator<C>,
>(contentType: string, itemClass: ItemClass<C>, mutatorClass: M) {
  const entry: MappingEntry<C> = {
    itemClass: itemClass,
    mutatorClass: mutatorClass as unknown as MutatorClass<C>,
  }
  ContentTypeClassMapping[contentType] = entry as unknown as MappingEntry<ItemContent>
}

export function CreateDecryptedItemFromPayload<
  C extends ItemContent = ItemContent,
  T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
>(payload: DecryptedPayloadInterface<C>): T {
  const lookupClass = ContentTypeClassMapping[payload.content_type]
  const itemClass = lookupClass ? lookupClass.itemClass : DecryptedItem
  const item = new itemClass(payload)
  return item as unknown as T
}

export function CreateItemFromPayload<
  C extends ItemContent = ItemContent,
  T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
>(
  payload: DecryptedPayloadInterface<C> | EncryptedPayloadInterface | DeletedPayloadInterface,
): EncryptedItemInterface | DeletedItemInterface | T {
  if (isDecryptedPayload(payload)) {
    return CreateDecryptedItemFromPayload<C, T>(payload)
  } else if (isEncryptedPayload(payload)) {
    return new EncryptedItem(payload)
  } else if (isDeletedPayload(payload)) {
    return new DeletedItem(payload)
  } else {
    throw Error('Unhandled case in CreateItemFromPayload')
  }
}
