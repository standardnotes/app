import * as Utils from './Utils.js'

const MaximumSyncOptions = {
  checkIntegrity: true,
  awaitAll: true,
}

export function createItemParams(contentType) {
  const params = {
    uuid: Utils.generateUuid(),
    content_type: contentType,
    content: {
      title: 'hello',
      text: 'world',
    },
  }
  return params
}

export function createNoteParams({ title, text, dirty = true } = {}) {
  const params = {
    uuid: Utils.generateUuid(),
    content_type: ContentType.TYPES.Note,
    dirty: dirty,
    dirtyIndex: dirty ? getIncrementedDirtyIndex() : undefined,
    content: FillItemContent({
      title: title || 'hello',
      text: text || 'world',
    }),
  }
  return params
}

export function createTagParams({ title, dirty = true, uuid = undefined } = {}) {
  const params = {
    uuid: uuid || Utils.generateUuid(),
    content_type: ContentType.TYPES.Tag,
    dirty: dirty,
    dirtyIndex: dirty ? getIncrementedDirtyIndex() : undefined,
    content: FillItemContent({
      title: title || 'thoughts',
    }),
  }
  return params
}

export function createRelatedNoteTagPairPayload({ noteTitle, noteText, tagTitle, dirty = true } = {}) {
  const noteParams = createNoteParams({
    title: noteTitle,
    text: noteText,
    dirty,
  })
  const tagParams = createTagParams({ title: tagTitle, dirty })
  tagParams.content.references = [
    {
      uuid: noteParams.uuid,
      content_type: noteParams.content_type,
    },
  ]
  noteParams.content.references = []
  return [new DecryptedPayload(noteParams), new DecryptedPayload(tagParams)]
}

export async function createSyncedNoteWithTag(application) {
  const payloads = createRelatedNoteTagPairPayload()
  await application.mutator.emitItemsFromPayloads(payloads)
  return application.sync.sync(MaximumSyncOptions)
}

export function createNotePayload(title, text = undefined, dirty = true) {
  return new DecryptedPayload(createNoteParams({ title, text, dirty }))
}
