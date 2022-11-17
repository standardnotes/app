import { UuidString } from '@Lib/Types'
import { ContentType } from '@standardnotes/common'
import { FullyFormedPayloadInterface } from '@standardnotes/models'

/**
 * Sorts payloads according by most recently modified first, according to the priority,
 * whereby the earlier a content_type appears in the priorityList,
 * the earlier it will appear in the resulting sorted array.
 */
function SortPayloadsByRecentAndContentPriority(
  payloads: FullyFormedPayloadInterface[],
  contentTypePriorityList: ContentType[],
): FullyFormedPayloadInterface[] {
  return payloads.sort((a, b) => {
    const dateResult = new Date(b.serverUpdatedAt).getTime() - new Date(a.serverUpdatedAt).getTime()

    let aPriority = 0
    let bPriority = 0

    aPriority = contentTypePriorityList.indexOf(a.content_type)
    bPriority = contentTypePriorityList.indexOf(b.content_type)

    if (aPriority === -1) {
      aPriority = contentTypePriorityList.length
    }

    if (bPriority === -1) {
      bPriority = contentTypePriorityList.length
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

/**
 * Sorts payloads according by most recently modified first, according to the priority,
 * whereby the earlier a uuid appears in the priorityList,
 * the earlier it will appear in the resulting sorted array.
 */
function SortPayloadsByRecentAndUuidPriority(
  payloads: FullyFormedPayloadInterface[],
  uuidPriorityList: UuidString[],
): FullyFormedPayloadInterface[] {
  return payloads.sort((a, b) => {
    const dateResult = new Date(b.serverUpdatedAt).getTime() - new Date(a.serverUpdatedAt).getTime()

    let aPriority = 0
    let bPriority = 0

    aPriority = uuidPriorityList.indexOf(a.uuid)
    bPriority = uuidPriorityList.indexOf(b.uuid)

    if (aPriority === -1) {
      aPriority = uuidPriorityList.length
    }

    if (bPriority === -1) {
      bPriority = uuidPriorityList.length
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

export function GetSortedPayloadsByPriority(
  payloads: FullyFormedPayloadInterface[],
  contentTypePriorityList: ContentType[],
  uuidPriorityList: UuidString[],
): {
  itemsKeyPayloads: FullyFormedPayloadInterface[]
  contentTypePriorityPayloads: FullyFormedPayloadInterface[]
  remainingPayloads: FullyFormedPayloadInterface[]
} {
  const itemsKeyPayloads: FullyFormedPayloadInterface[] = []
  const contentTypePriorityPayloads: FullyFormedPayloadInterface[] = []
  const remainingPayloads: FullyFormedPayloadInterface[] = []

  for (let index = 0; index < payloads.length; index++) {
    const payload = payloads[index]

    if (payload.content_type === ContentType.ItemsKey) {
      itemsKeyPayloads.push(payload)
    } else if (contentTypePriorityList.includes(payload.content_type)) {
      contentTypePriorityPayloads.push(payload)
    } else {
      remainingPayloads.push(payload)
    }
  }

  return {
    itemsKeyPayloads,
    contentTypePriorityPayloads: SortPayloadsByRecentAndContentPriority(
      contentTypePriorityPayloads,
      contentTypePriorityList,
    ),
    remainingPayloads: SortPayloadsByRecentAndUuidPriority(remainingPayloads, uuidPriorityList),
  }
}
