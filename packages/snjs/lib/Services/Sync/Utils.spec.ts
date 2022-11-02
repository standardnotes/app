import { ContentType } from '@standardnotes/common'
import { FullyFormedPayloadInterface } from '@standardnotes/models'
import { GetSortedPayloadsByPriority } from './Utils'

describe('GetSortedPayloadsByPriority', () => {
  let payloads: FullyFormedPayloadInterface[] = []
  const contentTypePriority = [ContentType.ItemsKey, ContentType.UserPrefs, ContentType.Component, ContentType.Theme]
  let launchPriorityUuids: string[] = []

  it('should sort payloads based on content type priority', () => {
    payloads = [
      {
        content_type: ContentType.Theme,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.UserPrefs,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Component,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.ItemsKey,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Note,
      } as FullyFormedPayloadInterface,
    ]

    const { itemsKeyPayloads, contentTypePriorityPayloads, remainingPayloads } = GetSortedPayloadsByPriority(
      payloads,
      contentTypePriority,
      launchPriorityUuids,
    )

    expect(itemsKeyPayloads.length).toBe(1)
    expect(itemsKeyPayloads[0].content_type).toBe(ContentType.ItemsKey)

    expect(contentTypePriorityPayloads.length).toBe(3)
    expect(contentTypePriorityPayloads[0].content_type).toBe(ContentType.UserPrefs)
    expect(contentTypePriorityPayloads[1].content_type).toBe(ContentType.Component)
    expect(contentTypePriorityPayloads[2].content_type).toBe(ContentType.Theme)

    expect(remainingPayloads.length).toBe(1)
    expect(remainingPayloads[0].content_type).toBe(ContentType.Note)
  })

  it('should sort payloads based on launch priority uuids', () => {
    const unprioritizedNoteUuid = 'unprioritized-note'
    const unprioritizedTagUuid = 'unprioritized-tag'

    const prioritizedNoteUuid = 'prioritized-note'
    const prioritizedTagUuid = 'prioritized-tag'

    payloads = [
      {
        content_type: ContentType.Theme,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.UserPrefs,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Component,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.ItemsKey,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Note,
        uuid: unprioritizedNoteUuid,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Tag,
        uuid: unprioritizedTagUuid,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Note,
        uuid: prioritizedNoteUuid,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Tag,
        uuid: prioritizedTagUuid,
      } as FullyFormedPayloadInterface,
    ]

    launchPriorityUuids = [prioritizedNoteUuid, prioritizedTagUuid]

    const { itemsKeyPayloads, contentTypePriorityPayloads, remainingPayloads } = GetSortedPayloadsByPriority(
      payloads,
      contentTypePriority,
      launchPriorityUuids,
    )

    expect(itemsKeyPayloads.length).toBe(1)
    expect(itemsKeyPayloads[0].content_type).toBe(ContentType.ItemsKey)

    expect(contentTypePriorityPayloads.length).toBe(3)
    expect(contentTypePriorityPayloads[0].content_type).toBe(ContentType.UserPrefs)
    expect(contentTypePriorityPayloads[1].content_type).toBe(ContentType.Component)
    expect(contentTypePriorityPayloads[2].content_type).toBe(ContentType.Theme)

    expect(remainingPayloads.length).toBe(4)
    expect(remainingPayloads[0].uuid).toBe(prioritizedNoteUuid)
    expect(remainingPayloads[1].uuid).toBe(prioritizedTagUuid)
    expect(remainingPayloads[2].uuid).toBe(unprioritizedNoteUuid)
    expect(remainingPayloads[3].uuid).toBe(unprioritizedTagUuid)
  })

  it('should sort payloads based on server updated date if same content type', () => {
    const unprioritizedNoteUuid = 'unprioritized-note'
    const unprioritizedTagUuid = 'unprioritized-tag'

    const prioritizedNoteUuid = 'prioritized-note'
    const prioritizedTagUuid = 'prioritized-tag'

    payloads = [
      {
        content_type: ContentType.Note,
        uuid: unprioritizedNoteUuid,
        serverUpdatedAt: new Date(1),
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Tag,
        uuid: unprioritizedTagUuid,
        serverUpdatedAt: new Date(2),
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Note,
        uuid: prioritizedNoteUuid,
      } as FullyFormedPayloadInterface,
      {
        content_type: ContentType.Tag,
        uuid: prioritizedTagUuid,
      } as FullyFormedPayloadInterface,
    ]

    launchPriorityUuids = [prioritizedNoteUuid, prioritizedTagUuid]

    const { remainingPayloads } = GetSortedPayloadsByPriority(payloads, contentTypePriority, launchPriorityUuids)

    expect(remainingPayloads.length).toBe(4)
    expect(remainingPayloads[0].uuid).toBe(prioritizedNoteUuid)
    expect(remainingPayloads[1].uuid).toBe(prioritizedTagUuid)
    expect(remainingPayloads[2].uuid).toBe(unprioritizedTagUuid)
    expect(remainingPayloads[3].uuid).toBe(unprioritizedNoteUuid)
  })
})
