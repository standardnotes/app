/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('item manager', function () {
  beforeEach(async function () {
    this.payloadManager = new PayloadManager()
    this.itemManager = new ItemManager(this.payloadManager)
    this.createNote = async () => {
      return this.itemManager.createItem(ContentType.Note, {
        title: 'hello',
        text: 'world',
      })
    }

    this.createTag = async (notes = []) => {
      const references = notes.map((note) => {
        return {
          uuid: note.uuid,
          content_type: note.content_type,
        }
      })
      return this.itemManager.createItem(ContentType.Tag, {
        title: 'thoughts',
        references: references,
      })
    }
  })

  it('create item', async function () {
    const item = await this.createNote()

    expect(item).to.be.ok
    expect(item.title).to.equal('hello')
  })

  it('emitting item through payload and marking dirty should have userModifiedDate', async function () {
    const payload = Factory.createNotePayload()
    const item = await this.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    const result = await this.itemManager.setItemDirty(item)
    const appData = result.payload.content.appData
    expect(appData[DecryptedItem.DefaultAppDomain()][AppDataField.UserModifiedDate]).to.be.ok
  })

  it('find items with valid uuid', async function () {
    const item = await this.createNote()

    const results = await this.itemManager.findItems([item.uuid])
    expect(results.length).to.equal(1)
    expect(results[0]).to.equal(item)
  })

  it('find items with invalid uuid no blanks', async function () {
    const results = await this.itemManager.findItems([Factory.generateUuidish()])
    expect(results.length).to.equal(0)
  })

  it('find items with invalid uuid include blanks', async function () {
    const includeBlanks = true
    const results = await this.itemManager.findItemsIncludingBlanks([Factory.generateUuidish()])
    expect(results.length).to.equal(1)
    expect(results[0]).to.not.be.ok
  })

  it('item state', async function () {
    await this.createNote()

    expect(this.itemManager.items.length).to.equal(1)
    expect(this.itemManager.getDisplayableNotes().length).to.equal(1)
  })

  it('find item', async function () {
    const item = await this.createNote()

    const foundItem = this.itemManager.findItem(item.uuid)
    expect(foundItem).to.be.ok
  })

  it('reference map', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])

    expect(this.itemManager.collection.referenceMap.directMap[tag.uuid]).to.eql([note.uuid])
  })

  it('inverse reference map', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])

    expect(this.itemManager.collection.referenceMap.inverseMap[note.uuid]).to.eql([tag.uuid])
  })

  it('inverse reference map should not have duplicates', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])
    await this.itemManager.changeItem(tag)

    expect(this.itemManager.collection.referenceMap.inverseMap[note.uuid]).to.eql([tag.uuid])
  })

  it('deleting from reference map', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])
    await this.itemManager.setItemToBeDeleted(note)

    expect(this.itemManager.collection.referenceMap.directMap[tag.uuid]).to.eql([])
    expect(this.itemManager.collection.referenceMap.inverseMap[note.uuid].length).to.equal(0)
  })

  it('deleting referenced item should update referencing item references', async function () {
    const note = await this.createNote()
    let tag = await this.createTag([note])
    await this.itemManager.setItemToBeDeleted(note)

    tag = this.itemManager.findItem(tag.uuid)
    expect(tag.content.references.length).to.equal(0)
  })

  it('removing relationship should update reference map', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])
    await this.itemManager.changeItem(tag, (mutator) => {
      mutator.removeItemAsRelationship(note)
    })

    expect(this.itemManager.collection.referenceMap.directMap[tag.uuid]).to.eql([])
    expect(this.itemManager.collection.referenceMap.inverseMap[note.uuid]).to.eql([])
  })

  it('emitting discardable payload should remove it from our collection', async function () {
    const note = await this.createNote()

    const payload = new DeletedPayload({
      ...note.payload.ejected(),
      content: undefined,
      deleted: true,
      dirty: false,
    })

    expect(payload.discardable).to.equal(true)

    await this.itemManager.emitItemFromPayload(payload)

    expect(this.itemManager.findItem(note.uuid)).to.not.be.ok
  })

  it('items that reference item', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])

    const itemsThatReference = this.itemManager.itemsReferencingItem(note)
    expect(itemsThatReference.length).to.equal(1)
    expect(itemsThatReference[0]).to.equal(tag)
  })

  it('observer', async function () {
    const observed = []
    this.itemManager.addObserver(ContentType.Any, ({ changed, inserted, removed, source, sourceKey }) => {
      observed.push({ changed, inserted, removed, source, sourceKey })
    })
    const note = await this.createNote()
    const tag = await this.createTag([note])
    expect(observed.length).to.equal(2)

    const firstObserved = observed[0]
    expect(firstObserved.inserted).to.eql([note])

    const secondObserved = observed[1]
    expect(secondObserved.inserted).to.eql([tag])
  })

  it('change existing item', async function () {
    const note = await this.createNote()
    const newTitle = String(Math.random())
    await this.itemManager.changeItem(note, (mutator) => {
      mutator.title = newTitle
    })

    const latestVersion = this.itemManager.findItem(note.uuid)
    expect(latestVersion.title).to.equal(newTitle)
  })

  it('change non-existant item through uuid should fail', async function () {
    const note = await this.itemManager.createTemplateItem(ContentType.Note, {
      title: 'hello',
      text: 'world',
    })

    const changeFn = async () => {
      const newTitle = String(Math.random())
      return this.itemManager.changeItem(note, (mutator) => {
        mutator.title = newTitle
      })
    }
    await Factory.expectThrowsAsync(() => changeFn(), 'Attempting to change non-existant item')
  })

  it('set items dirty', async function () {
    const note = await this.createNote()
    await this.itemManager.setItemDirty(note)

    const dirtyItems = this.itemManager.getDirtyItems()
    expect(dirtyItems.length).to.equal(1)
    expect(dirtyItems[0].uuid).to.equal(note.uuid)
    expect(dirtyItems[0].dirty).to.equal(true)
  })

  it('dirty items should not include errored items', async function () {
    const note = await this.itemManager.setItemDirty(await this.createNote())
    const errorred = new EncryptedPayload({
      ...note.payload,
      content: '004:...',
      errorDecrypting: true,
    })

    await this.itemManager.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const dirtyItems = this.itemManager.getDirtyItems()

    expect(dirtyItems.length).to.equal(0)
  })

  it('dirty items should include errored items if they are being deleted', async function () {
    const note = await this.itemManager.setItemDirty(await this.createNote())
    const errorred = new DeletedPayload({
      ...note.payload,
      content: undefined,
      errorDecrypting: true,
      deleted: true,
    })

    await this.itemManager.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const dirtyItems = this.itemManager.getDirtyItems()

    expect(dirtyItems.length).to.equal(1)
  })

  describe('duplicateItem', async function () {
    const sandbox = sinon.createSandbox()

    beforeEach(async function () {
      this.emitPayloads = sandbox.spy(this.itemManager.payloadManager, 'emitPayloads')
    })

    afterEach(async function () {
      sandbox.restore()
    })

    it('should duplicate the item and set the duplicate_of property', async function () {
      const note = await this.createNote()
      await this.itemManager.duplicateItem(note)
      sinon.assert.calledTwice(this.emitPayloads)

      const originalNote = this.itemManager.getDisplayableNotes()[0]
      const duplicatedNote = this.itemManager.getDisplayableNotes()[1]

      expect(this.itemManager.items.length).to.equal(2)
      expect(this.itemManager.getDisplayableNotes().length).to.equal(2)
      expect(originalNote.uuid).to.not.equal(duplicatedNote.uuid)
      expect(originalNote.uuid).to.equal(duplicatedNote.duplicateOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.duplicate_of)
      expect(duplicatedNote.conflictOf).to.be.undefined
      expect(duplicatedNote.payload.content.conflict_of).to.be.undefined
    })

    it('should duplicate the item and set the duplicate_of and conflict_of properties', async function () {
      const note = await this.createNote()
      await this.itemManager.duplicateItem(note, true)
      sinon.assert.calledTwice(this.emitPayloads)

      const originalNote = this.itemManager.getDisplayableNotes()[0]
      const duplicatedNote = this.itemManager.getDisplayableNotes()[1]

      expect(this.itemManager.items.length).to.equal(2)
      expect(this.itemManager.getDisplayableNotes().length).to.equal(2)
      expect(originalNote.uuid).to.not.equal(duplicatedNote.uuid)
      expect(originalNote.uuid).to.equal(duplicatedNote.duplicateOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.duplicate_of)
      expect(originalNote.uuid).to.equal(duplicatedNote.conflictOf)
      expect(originalNote.uuid).to.equal(duplicatedNote.payload.content.conflict_of)
    })

    it('duplicate item with relationships', async function () {
      const note = await this.createNote()
      const tag = await this.createTag([note])
      const duplicate = await this.itemManager.duplicateItem(tag)

      expect(duplicate.content.references).to.have.length(1)
      expect(this.itemManager.items).to.have.length(3)
      expect(this.itemManager.getDisplayableTags()).to.have.length(2)
    })

    it('adds duplicated item as a relationship to items referencing it', async function () {
      const note = await this.createNote()
      let tag = await this.createTag([note])
      const duplicateNote = await this.itemManager.duplicateItem(note)
      expect(tag.content.references).to.have.length(1)

      tag = this.itemManager.findItem(tag.uuid)
      const references = tag.content.references.map((ref) => ref.uuid)
      expect(references).to.have.length(2)
      expect(references).to.include(note.uuid, duplicateNote.uuid)
    })

    it('duplicates item with additional content', async function () {
      const note = await this.itemManager.createItem(ContentType.Note, {
        title: 'hello',
        text: 'world',
      })
      const duplicateNote = await this.itemManager.duplicateItem(note, false, {
        title: 'hello (copy)',
      })

      expect(duplicateNote.title).to.equal('hello (copy)')
      expect(duplicateNote.text).to.equal('world')
    })
  })

  it('set item deleted', async function () {
    const note = await this.createNote()
    await this.itemManager.setItemToBeDeleted(note)

    /** Items should never be mutated directly */
    expect(note.deleted).to.not.be.ok

    const latestVersion = this.payloadManager.findOne(note.uuid)
    expect(latestVersion.deleted).to.equal(true)
    expect(latestVersion.dirty).to.equal(true)
    expect(latestVersion.content).to.not.be.ok

    /** Deleted items do not show up in item manager's public interface */
    expect(this.itemManager.items.length).to.equal(0)
    expect(this.itemManager.getDisplayableNotes().length).to.equal(0)
  })

  it('system smart views', async function () {
    expect(this.itemManager.systemSmartViews.length).to.be.above(0)
  })

  it('find tag by title', async function () {
    const tag = await this.createTag()

    expect(this.itemManager.findTagByTitle(tag.title)).to.be.ok
  })

  it('find tag by title should be case insensitive', async function () {
    const tag = await this.createTag()

    expect(this.itemManager.findTagByTitle(tag.title.toUpperCase())).to.be.ok
  })

  it('find or create tag by title', async function () {
    const title = 'foo'

    expect(await this.itemManager.findOrCreateTagByTitle(title)).to.be.ok
  })

  it('note count', async function () {
    await this.createNote()
    expect(this.itemManager.noteCount).to.equal(1)
  })

  it('trash', async function () {
    const note = await this.createNote()
    const versionTwo = await this.itemManager.changeItem(note, (mutator) => {
      mutator.trashed = true
    })

    expect(this.itemManager.trashSmartView).to.be.ok
    expect(versionTwo.trashed).to.equal(true)
    expect(versionTwo.dirty).to.equal(true)
    expect(versionTwo.content).to.be.ok

    expect(this.itemManager.items.length).to.equal(1)
    expect(this.itemManager.trashedItems.length).to.equal(1)

    await this.itemManager.emptyTrash()
    const versionThree = this.payloadManager.findOne(note.uuid)
    expect(versionThree.deleted).to.equal(true)
    expect(this.itemManager.trashedItems.length).to.equal(0)
  })

  it('remove all items from memory', async function () {
    const observed = []
    this.itemManager.addObserver(ContentType.Any, ({ changed, inserted, removed, ignored }) => {
      observed.push({ changed, inserted, removed, ignored })
    })
    await this.createNote()
    await this.itemManager.removeAllItemsFromMemory()

    const deletionEvent = observed[1]
    expect(deletionEvent.removed[0].deleted).to.equal(true)
    expect(this.itemManager.items.length).to.equal(0)
  })

  it('remove item locally', async function () {
    const observed = []
    this.itemManager.addObserver(ContentType.Any, ({ changed, inserted, removed, ignored }) => {
      observed.push({ changed, inserted, removed, ignored })
    })
    const note = await this.createNote()
    await this.itemManager.removeItemLocally(note)

    expect(observed.length).to.equal(1)
    expect(this.itemManager.findItem(note.uuid)).to.not.be.ok
  })

  it('emitting a payload from within observer should queue to end', async function () {
    /**
     * From within an item observer, we want to emit some changes and await them.
     * We expect that the end result is that whatever was most recently emitted,
     * is propagated to listeners after any pending observation events. That is, when you
     * emit items, it should be done serially, so that emitting while you're emitting does
     * not interrupt the current emission, but instead queues it. This is so that changes
     * are not propagated out of order.
     */
    const payload = Factory.createNotePayload()
    const changedTitle = 'changed title'
    let didEmit = false
    let latestVersion
    this.itemManager.addObserver(ContentType.Note, ({ changed, inserted }) => {
      const all = changed.concat(inserted)
      if (!didEmit) {
        didEmit = true
        const changedPayload = payload.copy({
          content: {
            ...payload.content,
            title: changedTitle,
          },
        })
        this.itemManager.emitItemFromPayload(changedPayload)
      }
      latestVersion = all[0]
    })
    await this.itemManager.emitItemFromPayload(payload)
    expect(latestVersion.title).to.equal(changedTitle)
  })

  describe('searchTags', async function () {
    it('should return tag with query matching title', async function () {
      const tag = await this.itemManager.findOrCreateTagByTitle('tag')

      const results = this.itemManager.searchTags('tag')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return all tags with query partially matching title', async function () {
      const firstTag = await this.itemManager.findOrCreateTagByTitle('tag one')
      const secondTag = await this.itemManager.findOrCreateTagByTitle('tag two')

      const results = this.itemManager.searchTags('tag')
      expect(results).lengthOf(2)
      expect(results[0].title).to.equal(firstTag.title)
      expect(results[1].title).to.equal(secondTag.title)
    })
    it('should be case insensitive', async function () {
      const tag = await this.itemManager.findOrCreateTagByTitle('Tag')

      const results = this.itemManager.searchTags('tag')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return tag with query matching delimiter separated component', async function () {
      const tag = await this.itemManager.findOrCreateTagByTitle('parent.child')

      const results = this.itemManager.searchTags('child')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return tags with matching query including delimiter', async function () {
      const tag = await this.itemManager.findOrCreateTagByTitle('parent.child')

      const results = this.itemManager.searchTags('parent.chi')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })

    it('should return tags in natural order', async function () {
      const firstTag = await this.itemManager.findOrCreateTagByTitle('tag 100')
      const secondTag = await this.itemManager.findOrCreateTagByTitle('tag 2')
      const thirdTag = await this.itemManager.findOrCreateTagByTitle('tag b')
      const fourthTag = await this.itemManager.findOrCreateTagByTitle('tag a')

      const results = this.itemManager.searchTags('tag')
      expect(results).lengthOf(4)
      expect(results[0].title).to.equal(secondTag.title)
      expect(results[1].title).to.equal(firstTag.title)
      expect(results[2].title).to.equal(fourthTag.title)
      expect(results[3].title).to.equal(thirdTag.title)
    })

    it('should not return tags associated with note', async function () {
      const firstTag = await this.itemManager.findOrCreateTagByTitle('tag one')
      const secondTag = await this.itemManager.findOrCreateTagByTitle('tag two')

      const note = await this.createNote()
      await this.itemManager.changeItem(firstTag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(note)
      })

      const results = this.itemManager.searchTags('tag', note)
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(secondTag.title)
    })
  })

  describe('smart views', async function () {
    it('all view should not include archived notes by default', async function () {
      const normal = await this.createNote()

      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      this.itemManager.setPrimaryItemDisplayOptions({
        views: [this.itemManager.allNotesSmartView],
      })

      expect(this.itemManager.getDisplayableNotes().length).to.equal(0)
    })

    it('archived view should not include trashed notes by default', async function () {
      const normal = await this.createNote()

      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.archived = true
        mutator.trashed = true
      })

      this.itemManager.setPrimaryItemDisplayOptions({
        views: [this.itemManager.archivedSmartView],
      })

      expect(this.itemManager.getDisplayableNotes().length).to.equal(0)
    })

    it('trashed view should include archived notes by default', async function () {
      const normal = await this.createNote()

      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.archived = true
        mutator.trashed = true
      })

      this.itemManager.setPrimaryItemDisplayOptions({
        views: [this.itemManager.trashSmartView],
      })

      expect(this.itemManager.getDisplayableNotes().length).to.equal(1)
    })
  })

  describe('getSortedTagsForNote', async function () {
    it('should return tags associated with a note in natural order', async function () {
      const tags = [
        await this.itemManager.findOrCreateTagByTitle('tag 100'),
        await this.itemManager.findOrCreateTagByTitle('tag 2'),
        await this.itemManager.findOrCreateTagByTitle('tag b'),
        await this.itemManager.findOrCreateTagByTitle('tag a'),
      ]

      const note = await this.createNote()

      tags.map(async (tag) => {
        await this.itemManager.changeItem(tag, (mutator) => {
          mutator.e2ePendingRefactor_addItemAsRelationship(note)
        })
      })

      const results = this.itemManager.getSortedTagsForItem(note)

      expect(results).lengthOf(tags.length)
      expect(results[0].title).to.equal(tags[1].title)
      expect(results[1].title).to.equal(tags[0].title)
      expect(results[2].title).to.equal(tags[3].title)
      expect(results[3].title).to.equal(tags[2].title)
    })
  })

  describe('getTagParentChain', function () {
    it('should return parent tags for a tag', async function () {
      const [parent, child, grandchild, _other] = await Promise.all([
        this.itemManager.findOrCreateTagByTitle('parent'),
        this.itemManager.findOrCreateTagByTitle('parent.child'),
        this.itemManager.findOrCreateTagByTitle('parent.child.grandchild'),
        this.itemManager.findOrCreateTagByTitle('some other tag'),
      ])

      await this.itemManager.setTagParent(parent, child)
      await this.itemManager.setTagParent(child, grandchild)

      const results = this.itemManager.getTagParentChain(grandchild)

      expect(results).lengthOf(2)
      expect(results[0].uuid).to.equal(parent.uuid)
      expect(results[1].uuid).to.equal(child.uuid)
    })
  })
})
