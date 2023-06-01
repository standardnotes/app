/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
import { createRelatedNoteTagPairPayload } from '../lib/Items.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('notes + tags syncing', function () {
  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  after(function () {
    localStorage.clear()
  })

  beforeEach(async function () {
    this.application = await Factory.createInitAppWithFakeCrypto()
    Factory.disableIntegrityAutoHeal(this.application)
    const email = UuidGenerator.GenerateUuid()
    const password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: this.application,
      email,
      password,
    })
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
  })

  it('syncing an item then downloading it should include items_key_id', async function () {
    const note = await Factory.createMappedNote(this.application)
    await this.application.itemManager.setItemDirty(note)
    await this.application.syncService.sync(syncOptions)
    await this.application.payloadManager.resetState()
    await this.application.itemManager.resetState()
    await this.application.syncService.clearSyncPositionTokens()
    await this.application.syncService.sync(syncOptions)
    const downloadedNote = this.application.itemManager.getDisplayableNotes()[0]
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

    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    const tag = this.application.itemManager.getItems([ContentType.Tag])[0]
    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
    expect(this.application.itemManager.getDisplayableTags().length).to.equal(1)

    for (let i = 0; i < 9; i++) {
      await this.application.itemManager.setItemsDirty([note, tag])
      await this.application.syncService.sync(syncOptions)
      this.application.syncService.clearSyncPositionTokens()
      expect(tag.content.references.length).to.equal(1)
      expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(1)
      expect(tag.noteCount).to.equal(1)
      expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
      expect(this.application.itemManager.getDisplayableTags().length).to.equal(1)
      console.warn('Waiting 0.1s...')
      await Factory.sleep(0.1)
    }
  }).timeout(20000)

  it('handles signing in and merging data', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const originalNote = this.application.itemManager.getDisplayableNotes()[0]
    const originalTag = this.application.itemManager.getDisplayableTags()[0]
    await this.application.itemManager.setItemsDirty([originalNote, originalTag])

    await this.application.syncService.sync(syncOptions)

    expect(originalTag.content.references.length).to.equal(1)
    expect(originalTag.noteCount).to.equal(1)
    expect(this.application.itemManager.itemsReferencingItem(originalNote).length).to.equal(1)

    // when signing in, all local items are cleared from storage (but kept in memory; to clear desktop logs),
    // then resaved with alternated uuids.
    await this.application.diskStorageService.clearAllPayloads()
    await this.application.syncService.markAllItemsAsNeedingSyncAndPersist()

    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
    expect(this.application.itemManager.getDisplayableTags().length).to.equal(1)

    const note = this.application.itemManager.getDisplayableNotes()[0]
    const tag = this.application.itemManager.getDisplayableTags()[0]

    expect(tag.content.references.length).to.equal(1)
    expect(note.content.references.length).to.equal(0)

    expect(tag.noteCount).to.equal(1)
    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(1)
  })

  it('duplicating a tag should maintian its relationships', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getDisplayableNotes()[0]
    let tag = this.application.itemManager.getDisplayableTags()[0]
    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(1)

    await this.application.itemManager.setItemsDirty([note, tag])
    await this.application.syncService.sync(syncOptions)
    await this.application.syncService.clearSyncPositionTokens()

    note = this.application.itemManager.findItem(note.uuid)
    tag = this.application.itemManager.findItem(tag.uuid)

    expect(note.dirty).to.equal(false)
    expect(tag.dirty).to.equal(false)

    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
    expect(this.application.itemManager.getDisplayableTags().length).to.equal(1)

    await Factory.changePayloadTimeStampAndSync(
      this.application,
      tag.payload,
      Factory.dateToMicroseconds(Factory.yesterday()),
      {
        title: `${Math.random()}`,
      },
      syncOptions,
    )

    tag = this.application.itemManager.findItem(tag.uuid)

    // tag should now be conflicted and a copy created
    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
    expect(this.application.itemManager.getDisplayableTags().length).to.equal(2)

    const tags = this.application.itemManager.getDisplayableTags()
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

    expect(this.application.itemManager.itemsReferencingItem(conflictedTag).length).to.equal(0)
    expect(this.application.itemManager.itemsReferencingItem(originalTag).length).to.equal(0)

    // Two tags now link to this note
    const referencingItems = this.application.itemManager.itemsReferencingItem(note)
    expect(referencingItems.length).to.equal(2)
    expect(referencingItems[0]).to.not.equal(referencingItems[1])
  }).timeout(10000)
})
