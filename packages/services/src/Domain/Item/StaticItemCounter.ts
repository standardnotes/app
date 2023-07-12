import { ContentType } from '@standardnotes/domain-core'
import { SNNote, SNTag, ItemCounts } from '@standardnotes/models'

export class StaticItemCounter {
  countNotesAndTags(items: Array<SNNote | SNTag>): ItemCounts {
    const counts: ItemCounts = {
      notes: 0,
      archived: 0,
      deleted: 0,
      tags: 0,
    }

    for (const item of items) {
      if (item.trashed) {
        counts.deleted++

        continue
      }
      if (item.archived) {
        counts.archived++

        continue
      }
      if (item.content_type === ContentType.TYPES.Note && !item.conflictOf) {
        counts.notes++

        continue
      }
      if (item.content_type === ContentType.TYPES.Tag) {
        counts.tags++

        continue
      }
    }

    return counts
  }
}
