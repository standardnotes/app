import { ContentType } from '@standardnotes/common'
import { EncryptedItem } from '../../Abstract/Item/Implementations/EncryptedItem'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { FileItem } from '../../Syncable/File/File'
import { SNFeatureRepo } from '../../Syncable/FeatureRepo/FeatureRepo'
import { SNActionsExtension } from '../../Syncable/ActionsExtension/ActionsExtension'
import { SNComponent } from '../../Syncable/Component/Component'
import { SNEditor } from '../../Syncable/Editor/Editor'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { SNNote } from '../../Syncable/Note/Note'
import { SmartView } from '../../Syncable/SmartView/SmartView'
import { SNTag } from '../../Syncable/Tag/Tag'
import { SNTheme } from '../../Syncable/Theme/Theme'
import { SNUserPrefs } from '../../Syncable/UserPrefs/UserPrefs'
import { FileMutator } from '../../Syncable/File/FileMutator'
import { MutationType } from '../../Abstract/Item/Types/MutationType'
import { ThemeMutator } from '../../Syncable/Theme/ThemeMutator'
import { UserPrefsMutator } from '../../Syncable/UserPrefs/UserPrefsMutator'
import { ActionsExtensionMutator } from '../../Syncable/ActionsExtension/ActionsExtensionMutator'
import { ComponentMutator } from '../../Syncable/Component/ComponentMutator'
import { TagMutator } from '../../Syncable/Tag/TagMutator'
import { NoteMutator } from '../../Syncable/Note/NoteMutator'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import {
  DeletedPayloadInterface,
  EncryptedPayloadInterface,
  isDecryptedPayload,
  isDeletedPayload,
  isEncryptedPayload,
} from '../../Abstract/Payload'
import { DeletedItem } from '../../Abstract/Item/Implementations/DeletedItem'
import { EncryptedItemInterface } from '../../Abstract/Item/Interfaces/EncryptedItem'
import { DeletedItemInterface } from '../../Abstract/Item/Interfaces/DeletedItem'
import { SmartViewMutator } from '../../Syncable/SmartView'

type ItemClass<C extends ItemContent = ItemContent> = new (payload: DecryptedPayloadInterface<C>) => DecryptedItem<C>

type MutatorClass<C extends ItemContent = ItemContent> = new (
  item: DecryptedItemInterface<C>,
  type: MutationType,
) => DecryptedItemMutator<C>

type MappingEntry<C extends ItemContent = ItemContent> = {
  itemClass: ItemClass<C>
  mutatorClass?: MutatorClass<C>
}

const ContentTypeClassMapping: Partial<Record<ContentType, MappingEntry>> = {
  [ContentType.ActionsExtension]: {
    itemClass: SNActionsExtension,
    mutatorClass: ActionsExtensionMutator,
  },
  [ContentType.Component]: { itemClass: SNComponent, mutatorClass: ComponentMutator },
  [ContentType.Editor]: { itemClass: SNEditor },
  [ContentType.ExtensionRepo]: { itemClass: SNFeatureRepo },
  [ContentType.File]: { itemClass: FileItem, mutatorClass: FileMutator },
  [ContentType.Note]: { itemClass: SNNote, mutatorClass: NoteMutator },
  [ContentType.SmartView]: { itemClass: SmartView, mutatorClass: SmartViewMutator },
  [ContentType.Tag]: { itemClass: SNTag, mutatorClass: TagMutator },
  [ContentType.Theme]: { itemClass: SNTheme, mutatorClass: ThemeMutator },
  [ContentType.UserPrefs]: { itemClass: SNUserPrefs, mutatorClass: UserPrefsMutator },
} as unknown as Partial<Record<ContentType, MappingEntry>>

export function CreateDecryptedMutatorForItem<
  I extends DecryptedItemInterface,
  M extends DecryptedItemMutator = DecryptedItemMutator,
>(item: I, type: MutationType): M {
  const lookupValue = ContentTypeClassMapping[item.content_type]?.mutatorClass
  if (lookupValue) {
    return new lookupValue(item, type) as M
  } else {
    return new DecryptedItemMutator(item, type) as M
  }
}

export function RegisterItemClass<
  C extends ItemContent = ItemContent,
  M extends DecryptedItemMutator<C> = DecryptedItemMutator<C>,
>(contentType: ContentType, itemClass: ItemClass<C>, mutatorClass: M) {
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
