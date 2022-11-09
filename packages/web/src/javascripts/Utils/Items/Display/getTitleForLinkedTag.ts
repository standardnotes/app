import { DecryptedItem, SNTag, WebApplicationInterface } from '@standardnotes/snjs'

type ReturnType =
  | {
      titlePrefix: string | undefined
      longTitle: string
    }
  | undefined

export function getTitleForLinkedTag(item: DecryptedItem, application: WebApplicationInterface): ReturnType {
  const isTag = item instanceof SNTag

  if (!isTag) {
    return
  }

  const titlePrefix = application.items.getTagPrefixTitle(item)
  const longTitle = application.items.getTagLongTitle(item)
  return {
    titlePrefix,
    longTitle,
  }
}
