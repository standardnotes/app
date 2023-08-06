import * as Factory from '../lib/factory.js'
import { createRelatedNoteTagPairPayload } from '../lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('notes + tags syncing', function () {
  let application

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  after(function () {
    localStorage.clear()
  })

  beforeEach(async function () {
    application = await Factory.createInitAppWithFakeCrypto()
    Factory.disableIntegrityAutoHeal(application)
    const email = UuidGenerator.GenerateUuid()
    const password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: application,
      email,
      password,
    })
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = undefined
  })

  it('syncing an item then downloading it should include items_key_id', async function () {
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)
    await application.payloads.resetState()
    await application.items.resetState()
    await application.sync.clearSyncPositionTokens()
    await application.sync.sync(syncOptions)
    const downloadedNote = application.items.getDisplayableNotes()[0]
    expect(downloadedNote.items_key_id).to.not.be.ok
    // Allow time for waitingForKey
    await Factory.sleep(0.1)
    expect(downloadedNote.title).to.be.ok
    expect(downloadedNote.content.text).to.be.ok
  })

  it('syncing a note many times does not cause duplication', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    const tag = application.items.getItems([ContentType.TYPES.Tag])[0]
    expect(application.items.getDisplayableNotes().length).to.equal(1)
    expect(application.items.getDisplayableTags().length).to.equal(1)

    for (let i = 0; i < 9; i++) {
      await application.mutator.setItemsDirty([note, tag])
      await application.sync.sync(syncOptions)
      application.sync.clearSyncPositionTokens()
      expect(tag.content.references.length).to.equal(1)
      expect(application.items.itemsReferencingItem(note).length).to.equal(1)
      expect(tag.noteCount).to.equal(1)
      expect(application.items.getDisplayableNotes().length).to.equal(1)
      expect(application.items.getDisplayableTags().length).to.equal(1)
      console.warn('Waiting 0.1s...')
      await Factory.sleep(0.1)
    }
  }).timeout(20000)

  it('handles signing in and merging data', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const originalNote = application.items.getDisplayableNotes()[0]
    const originalTag = application.items.getDisplayableTags()[0]
    await application.mutator.setItemsDirty([originalNote, originalTag])

    await application.sync.sync(syncOptions)

    expect(originalTag.content.references.length).to.equal(1)
    expect(originalTag.noteCount).to.equal(1)
    expect(application.items.itemsReferencingItem(originalNote).length).to.equal(1)

    // when signing in, all local items are cleared from storage (but kept in memory; to clear desktop logs),
    // then resaved with alternated uuids.
    await application.storage.clearAllPayloads()
    await application.sync.markAllItemsAsNeedingSyncAndPersist()

    expect(application.items.getDisplayableNotes().length).to.equal(1)
    expect(application.items.getDisplayableTags().length).to.equal(1)

    const note = application.items.getDisplayableNotes()[0]
    const tag = application.items.getDisplayableTags()[0]

    expect(tag.content.references.length).to.equal(1)
    expect(note.content.references.length).to.equal(0)

    expect(tag.noteCount).to.equal(1)
    expect(application.items.itemsReferencingItem(note).length).to.equal(1)
  })

  it('duplicating a tag should maintian its relationships', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = application.items.getDisplayableNotes()[0]
    let tag = application.items.getDisplayableTags()[0]
    expect(application.items.itemsReferencingItem(note).length).to.equal(1)

    await application.mutator.setItemsDirty([note, tag])
    await application.sync.sync(syncOptions)
    await application.sync.clearSyncPositionTokens()

    note = application.items.findItem(note.uuid)
    tag = application.items.findItem(tag.uuid)

    expect(note.dirty).to.equal(false)
    expect(tag.dirty).to.equal(false)

    expect(application.items.getDisplayableNotes().length).to.equal(1)
    expect(application.items.getDisplayableTags().length).to.equal(1)

    await Factory.changePayloadTimeStampAndSync(
      application,
      tag.payload,
      Factory.dateToMicroseconds(Factory.yesterday()),
      {
        title: `${Math.random()}`,
      },
      syncOptions,
    )

    tag = application.items.findItem(tag.uuid)

    // tag should now be conflicted and a copy created
    expect(application.items.getDisplayableNotes().length).to.equal(1)
    expect(application.items.getDisplayableTags().length).to.equal(2)

    const tags = application.items.getDisplayableTags()
    const conflictedTag = tags.find((tag) => {
      return !!tag.content.conflict_of
    })
    const originalTag = tags.find((tag) => {
      return tag !== conflictedTag
    })

    expect(conflictedTag.uuid).to.not.equal(originalTag.uuid)

    expect(originalTag.uuid).to.equal(tag.uuid)
    expect(conflictedTag.content.conflict_of).to.equal(originalTag.uuid)
    expect(conflictedTag.noteCount).to.equal(originalTag.noteCount)

    expect(application.items.itemsReferencingItem(conflictedTag).length).to.equal(0)
    expect(application.items.itemsReferencingItem(originalTag).length).to.equal(0)

    // Two tags now link to this note
    const referencingItems = application.items.itemsReferencingItem(note)
    expect(referencingItems.length).to.equal(2)
    expect(referencingItems[0]).to.not.equal(referencingItems[1])
  }).timeout(10000)
})
