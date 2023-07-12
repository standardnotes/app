import { MutatorClientInterface } from '@standardnotes/services'
import { SNTag, TagMutator, TagFolderDelimitter } from '@standardnotes/models'
import { ItemManager } from '@Lib/Services'
import { lastElement, sortByKey, withoutLastElement } from '@standardnotes/utils'
import { ContentType } from '@standardnotes/domain-core'

export class TagsToFoldersMigrationApplicator {
  public static isApplicableToCurrentData(itemManager: ItemManager): boolean {
    const tags = itemManager.getItems<SNTag>(ContentType.TYPES.Tag)
    for (const tag of tags) {
      if (tag.title.includes(TagFolderDelimitter) && !tag.parentId) {
        return true
      }
    }

    return false
  }

  public static async run(itemManager: ItemManager, mutator: MutatorClientInterface): Promise<void> {
    const tags = itemManager.getItems(ContentType.TYPES.Tag) as SNTag[]
    const sortedTags = sortByKey(tags, 'title')

    for (const tag of sortedTags) {
      const hierarchy = tag.title.split(TagFolderDelimitter)
      const hasSimpleTitle = hierarchy.length === 1
      const hasParent = !!tag.parentId
      const hasUnsupportedTitle = hierarchy.some((title) => title.length === 0)

      if (hasParent || hasSimpleTitle || hasUnsupportedTitle) {
        continue
      }

      const parents = withoutLastElement(hierarchy)
      const newTitle = lastElement(hierarchy)

      if (!newTitle) {
        return
      }

      const parent = await mutator.findOrCreateTagParentChain(parents)

      await mutator.changeItem(tag, (mutator: TagMutator) => {
        mutator.title = newTitle

        if (parent) {
          mutator.makeChildOf(parent)
        }
      })
    }
  }
}
