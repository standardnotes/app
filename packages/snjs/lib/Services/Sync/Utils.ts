import { UuidString } from '@Lib/Types'
import { ContentType } from '@standardnotes/common'
import { FullyFormedPayloadInterface } from '@standardnotes/models'

/**
 * Sorts payloads according by most recently modified first, according to the priority,
 * whereby the earlier a content_type appears in the priorityList,
 * the earlier it will appear in the resulting sorted array.
 */
export function SortPayloadsByRecentAndContentPriority(
  payloads: FullyFormedPayloadInterface[],
  priorityList: ContentType[],
  itemUuidsToPrioritize: UuidString[],
): FullyFormedPayloadInterface[] {
  return payloads.sort((a, b) => {
    const dateResult = new Date(b.serverUpdatedAt).getTime() - new Date(a.serverUpdatedAt).getTime()

    let aPriority = 0
    let bPriority = 0

    if (priorityList) {
      const aIsContentTypePriority = priorityList.includes(a.content_type)
      const bIsContentTypePriority = priorityList.includes(b.content_type)

      const aHasUuidToPrioritize = itemUuidsToPrioritize.includes(a.uuid)
      const bHasUuidToPrioritize = itemUuidsToPrioritize.includes(b.uuid)

      if (aIsContentTypePriority) {
        aPriority = priorityList.indexOf(a.content_type)
      } else if (aHasUuidToPrioritize) {
        aPriority = itemUuidsToPrioritize.indexOf(a.uuid) + priorityList.length
      } else {
        aPriority = priorityList.length + itemUuidsToPrioritize.length
      }

      if (bIsContentTypePriority) {
        bPriority = priorityList.indexOf(b.content_type)
      } else if (bHasUuidToPrioritize) {
        bPriority = itemUuidsToPrioritize.indexOf(b.uuid) + priorityList.length
      } else {
        bPriority = priorityList.length + itemUuidsToPrioritize.length
      }
    }

    if (aPriority === bPriority) {
      return dateResult
    }

    if (aPriority < bPriority) {
      return -1
    } else {
      return 1
    }
  })
}
