import { ContentType } from '@standardnotes/common'
import { FullyFormedPayloadInterface } from '@standardnotes/models'
import { SortPayloadsByRecentAndContentPriority } from './Utils'

describe('SortPayloadsByRecentAndContentPriority', () => {
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

    const sortedPayloads = SortPayloadsByRecentAndContentPriority(payloads, contentTypePriority, launchPriorityUuids)

    expect(sortedPayloads[0].content_type).toBe(ContentType.ItemsKey)
    expect(sortedPayloads[1].content_type).toBe(ContentType.UserPrefs)
    expect(sortedPayloads[2].content_type).toBe(ContentType.Component)
    expect(sortedPayloads[3].content_type).toBe(ContentType.Theme)
    expect(sortedPayloads[4].content_type).toBe(ContentType.Note)
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

    const sortedPayloads = SortPayloadsByRecentAndContentPriority(payloads, contentTypePriority, launchPriorityUuids)

    expect(sortedPayloads[0].content_type).toBe(ContentType.ItemsKey)
    expect(sortedPayloads[1].content_type).toBe(ContentType.UserPrefs)
    expect(sortedPayloads[2].content_type).toBe(ContentType.Component)
    expect(sortedPayloads[3].content_type).toBe(ContentType.Theme)
    expect(sortedPayloads[4].uuid).toBe(prioritizedNoteUuid)
    expect(sortedPayloads[5].uuid).toBe(prioritizedTagUuid)
    expect(sortedPayloads[6].uuid).toBe(unprioritizedTagUuid)
    expect(sortedPayloads[7].uuid).toBe(unprioritizedNoteUuid)
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

    const sortedPayloads = SortPayloadsByRecentAndContentPriority(payloads, contentTypePriority, launchPriorityUuids)

    expect(sortedPayloads[0].uuid).toBe(prioritizedNoteUuid)
    expect(sortedPayloads[1].uuid).toBe(prioritizedTagUuid)
    expect(sortedPayloads[2].uuid).toBe(unprioritizedTagUuid)
    expect(sortedPayloads[3].uuid).toBe(unprioritizedNoteUuid)
  })
})
