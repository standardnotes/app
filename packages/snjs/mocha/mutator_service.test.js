import * as Factory from './lib/factory.js'
import { BaseItemCounts } from './lib/BaseItemCounts.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('mutator service', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let application
  let mutator

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithFakeCrypto()
    application = context.application
    mutator = application.mutator

    await context.launch()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    context = undefined
  })

  const createNote = async () => {
    return mutator.createItem(ContentType.TYPES.Note, {
      title: 'hello',
      text: 'world',
    })
  }

  const createTag = async (notes = []) => {
    const references = notes.map((note) => {
      return {
        uuid: note.uuid,
        content_type: note.content_type,
      }
    })
    return mutator.createItem(ContentType.TYPES.Tag, {
      title: 'thoughts',
      references: references,
    })
  }

  it('create item', async function () {
    const item = await createNote()

    expect(item).to.be.ok
    expect(item.title).to.equal('hello')
  })

  it('emitting item through payload and marking dirty should have userModifiedDate', async function () {
    const payload = Factory.createNotePayload()
    const item = await mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    const result = await mutator.setItemDirty(item)
    const appData = result.payload.content.appData
    expect(appData[DecryptedItem.DefaultAppDomain()][AppDataField.UserModifiedDate]).to.be.ok
  })

  it('deleting an item should make it immediately unfindable', async () => {
    const note = await context.createSyncedNote()
    await mutator.setItemToBeDeleted(note)
    const foundNote = application.items.findItem(note.uuid)
    expect(foundNote).to.not.be.ok
  })

  it('deleting from reference map', async function () {
    const note = await createNote()
    const tag = await createTag([note])
    await mutator.setItemToBeDeleted(note)

    expect(application.items.collection.referenceMap.directMap.get(tag.uuid)).to.eql([])
    expect(application.items.collection.referenceMap.inverseMap.get(note.uuid).length).to.equal(0)
  })

  it('deleting referenced item should update referencing item references', async function () {
    const note = await createNote()
    let tag = await createTag([note])
    await mutator.setItemToBeDeleted(note)

    tag = application.items.findItem(tag.uuid)
    expect(tag.content.references.length).to.equal(0)
  })

  it('removing relationship should update reference map', async function () {
    const note = await createNote()
    const tag = await createTag([note])
    await mutator.changeItem(tag, (mutator) => {
      mutator.removeItemAsRelationship(note)
    })

    expect(application.items.collection.referenceMap.directMap.get(tag.uuid)).to.eql([])
    expect(application.items.collection.referenceMap.inverseMap.get(note.uuid)).to.eql([])
  })

  it('emitting discardable payload should remove it from our collection', async function () {
    const note = await createNote()

    const payload = new DeletedPayload({
      ...note.payload.ejected(),
      content: undefined,
      deleted: true,
      dirty: false,
    })

    expect(payload.discardable).to.equal(true)

    await context.payloads.emitPayload(payload)

    expect(application.items.findItem(note.uuid)).to.not.be.ok
  })

  it('change existing item', async function () {
    const note = await createNote()
    const newTitle = String(Math.random())
    await mutator.changeItem(note, (mutator) => {
      mutator.title = newTitle
    })

    const latestVersion = application.items.findItem(note.uuid)
    expect(latestVersion.title).to.equal(newTitle)
  })

  it('change non-existant item through uuid should fail', async function () {
    const note = await application.items.createTemplateItem(ContentType.TYPES.Note, {
      title: 'hello',
      text: 'world',
    })

    const changeFn = async () => {
      const newTitle = String(Math.random())
      return mutator.changeItem(note, (mutator) => {
        mutator.title = newTitle
      })
    }
    await Factory.expectThrowsAsync(() => changeFn(), 'Attempting to change non-existant item')
  })

  it('set items dirty', async function () {
    const note = await createNote()
    await mutator.setItemDirty(note)

    const dirtyItems = application.items.getDirtyItems()
    expect(dirtyItems.length).to.equal(1)
    expect(dirtyItems[0].uuid).to.equal(note.uuid)
    expect(dirtyItems[0].dirty).to.equal(true)
  })

  describe('duplicateItem', async function () {
    const sandbox = sinon.createSandbox()

    let emitPayloads

    beforeEach(async function () {
      emitPayloads = sandbox.spy(application.payloads, 'emitPayloads')
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should duplicate the item and set the duplicate_of property', async function () {
      const note = await createNote()
      await mutator.duplicateItem(note)
      sinon.assert.calledTwice(emitPayloads)

      const originalNote = application.items.getDisplayableNotes()[0]
      const duplicatedNote = application.items.getDisplayableNotes()[1]

      expect(application.items.items.length).to.equal(2 + BaseItemCounts.DefaultItems)
      expect(application.items.getDisplayableNotes().length).to.equal(2)
      expect(originalNote.uuid).to.not.equal(duplicatedNote.uuid)
      expect(originalNote.uuid).to.equal(duplicatedNote.duplicateOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.duplicate_of)
      expect(duplicatedNote.conflictOf).to.be.undefined
      expect(duplicatedNote.payload.content.conflict_of).to.be.undefined
    })

    it('should duplicate the item and set the duplicate_of and conflict_of properties', async function () {
      const note = await createNote()
      await mutator.duplicateItem(note, true)
      sinon.assert.calledTwice(emitPayloads)

      const originalNote = application.items.getDisplayableNotes()[0]
      const duplicatedNote = application.items.getDisplayableNotes()[1]

      expect(application.items.items.length).to.equal(2 + BaseItemCounts.DefaultItems)
      expect(application.items.getDisplayableNotes().length).to.equal(2)
      expect(originalNote.uuid).to.not.equal(duplicatedNote.uuid)
      expect(originalNote.uuid).to.equal(duplicatedNote.duplicateOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.duplicate_of)
      expect(originalNote.uuid).to.equal(duplicatedNote.conflictOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.content.conflict_of)
    })

    it('duplicate item with relationships', async function () {
      const note = await createNote()
      const tag = await createTag([note])
      const duplicate = await mutator.duplicateItem(tag)

      expect(duplicate.content.references).to.have.length(1)
      expect(application.items.items).to.have.length(3 + BaseItemCounts.DefaultItems)
      expect(application.items.getDisplayableTags()).to.have.length(2)
    })

    it('adds duplicated item as a relationship to items referencing it', async function () {
      const note = await createNote()
      let tag = await createTag([note])
      const duplicateNote = await mutator.duplicateItem(note)
      expect(tag.content.references).to.have.length(1)

      tag = application.items.findItem(tag.uuid)
      const references = tag.content.references.map((ref) => ref.uuid)
      expect(references).to.have.length(2)
      expect(references).to.include(note.uuid, duplicateNote.uuid)
    })

    it('duplicates item with additional content', async function () {
      const note = await mutator.createItem(ContentType.TYPES.Note, {
        title: 'hello',
        text: 'world',
      })
      const duplicateNote = await mutator.duplicateItem(note, false, {
        title: 'hello (copy)',
      })

      expect(duplicateNote.title).to.equal('hello (copy)')
      expect(duplicateNote.text).to.equal('world')
    })
  })

  it('set item deleted', async function () {
    const note = await createNote()
    await mutator.setItemToBeDeleted(note)

    /** Items should never be mutated directly */
    expect(note.deleted).to.not.be.ok

    const latestVersion = context.payloads.findOne(note.uuid)
    expect(latestVersion.deleted).to.equal(true)
    expect(latestVersion.dirty).to.equal(true)
    expect(latestVersion.content).to.not.be.ok

    /** Deleted items do not show up in item manager's public interface */
    expect(application.items.items.length).to.equal(BaseItemCounts.DefaultItems)
    expect(application.items.getDisplayableNotes().length).to.equal(0)
  })

  it('should empty trash', async function () {
    const note = await createNote()
    const versionTwo = await mutator.changeItem(note, (mutator) => {
      mutator.trashed = true
    })

    expect(application.items.trashSmartView).to.be.ok
    expect(versionTwo.trashed).to.equal(true)
    expect(versionTwo.dirty).to.equal(true)
    expect(versionTwo.content).to.be.ok

    expect(application.items.items.length).to.equal(1 + BaseItemCounts.DefaultItems)
    expect(application.items.trashedItems.length).to.equal(1)

    await application.mutator.emptyTrash()
    const versionThree = context.payloads.findOne(note.uuid)
    expect(versionThree.deleted).to.equal(true)
    expect(application.items.trashedItems.length).to.equal(0)
  })
})
