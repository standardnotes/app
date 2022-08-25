import { ContentType } from '@standardnotes/common'
import { SNNote, SNTag, ItemCounts } from '@standardnotes/models'

import { ItemCounterInterface } from './ItemCounterInterface'

export class ItemCounter implements ItemCounterInterface {
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
      if (item.content_type === ContentType.Note) {
        counts.notes++

        continue
      }
      if (item.content_type === ContentType.Tag) {
        counts.tags++

        continue
      }
    }

    return counts
  }
}
