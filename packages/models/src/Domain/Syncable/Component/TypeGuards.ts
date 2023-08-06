import { ComponentInterface } from './ComponentInterface'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { isDecryptedItem } from '../../Abstract/Item'
import { ContentType } from '@standardnotes/domain-core'

export function isComponent(x: ItemInterface): x is ComponentInterface {
  if (!isDecryptedItem(x as DecryptedItemInterface)) {
    return false
  }

  return x.content_type === ContentType.TYPES.Component
}

export function isTheme(x: ItemInterface): x is ComponentInterface {
  if (!isDecryptedItem(x as DecryptedItemInterface)) {
    return false
  }

  return x.content_type === ContentType.TYPES.Theme
}

export function isComponentOrTheme(x: ItemInterface): x is ComponentInterface {
  if (!isDecryptedItem(x as DecryptedItemInterface)) {
    return false
  }

  return x.content_type === ContentType.TYPES.Component || x.content_type === ContentType.TYPES.Theme
}
