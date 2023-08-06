import * as Factory from './lib/factory.js'
import { BaseItemCounts } from './lib/BaseItemCounts.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('item manager', function () {
  let context
  let application

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithFakeCrypto()
    application = context.application

    await context.launch()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()

    context = undefined
    application = undefined
  })

  const createNote = async () => {
    return application.mutator.createItem(ContentType.TYPES.Note, {
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
    return application.mutator.createItem(ContentType.TYPES.Tag, {
      title: 'thoughts',
      references: references,
    })
  }

  it('find items with valid uuid', async function () {
    const item = await createNote()

    const results = await application.items.findItems([item.uuid])
    expect(results.length).to.equal(1)
    expect(results[0]).to.equal(item)
  })

  it('find items with invalid uuid no blanks', async function () {
    const results = await application.items.findItems([Factory.generateUuidish()])
    expect(results.length).to.equal(0)
  })

  it('find items with invalid uuid include blanks', async function () {
    const results = await application.items.findItemsIncludingBlanks([Factory.generateUuidish()])
    expect(results.length).to.equal(1)
    expect(results[0]).to.not.be.ok
  })

  it('item state', async function () {
    await createNote()

    expect(application.items.items.length).to.equal(1 + BaseItemCounts.DefaultItems)
    expect(application.items.getDisplayableNotes().length).to.equal(1)
  })

  it('find item', async function () {
    const item = await createNote()

    const foundItem = application.items.findItem(item.uuid)
    expect(foundItem).to.be.ok
  })

  it('reference map', async function () {
    const note = await createNote()
    const tag = await createTag([note])

    expect(application.items.collection.referenceMap.directMap.get(tag.uuid)).to.eql([note.uuid])
  })

  it('inverse reference map', async function () {
    const note = await createNote()
    const tag = await createTag([note])

    expect(application.items.collection.referenceMap.inverseMap.get(note.uuid)).to.eql([tag.uuid])
  })

  it('inverse reference map should not have duplicates', async function () {
    const note = await createNote()
    const tag = await createTag([note])
    await application.mutator.changeItem(tag)

    expect(application.items.collection.referenceMap.inverseMap.get(note.uuid)).to.eql([tag.uuid])
  })

  it('items that reference item', async function () {
    const note = await createNote()
    const tag = await createTag([note])

    const itemsThatReference = application.items.itemsReferencingItem(note)
    expect(itemsThatReference.length).to.equal(1)
    expect(itemsThatReference[0]).to.equal(tag)
  })

  it('observer', async function () {
    const observed = []
    application.items.addObserver(ContentType.TYPES.Any, ({ changed, inserted, removed, source, sourceKey }) => {
      observed.push({ changed, inserted, removed, source, sourceKey })
    })
    const note = await createNote()
    const tag = await createTag([note])
    expect(observed.length).to.equal(2)

    const firstObserved = observed[0]
    expect(firstObserved.inserted).to.eql([note])

    const secondObserved = observed[1]
    expect(secondObserved.inserted).to.eql([tag])
  })

  it('dirty items should not include errored items', async function () {
    const note = await application.mutator.setItemDirty(await createNote())
    const errorred = new EncryptedPayload({
      ...note.payload,
      content: '004:...',
      errorDecrypting: true,
    })

    await application.mutator.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const dirtyItems = application.items.getDirtyItems()

    expect(dirtyItems.length).to.equal(0)
  })

  it('dirty items should include errored items if they are being deleted', async function () {
    const note = await application.mutator.setItemDirty(await createNote())
    const errorred = new DeletedPayload({
      ...note.payload,
      content: undefined,
      errorDecrypting: true,
      deleted: true,
    })

    await application.mutator.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const dirtyItems = application.items.getDirtyItems()

    expect(dirtyItems.length).to.equal(1)
  })

  it('system smart views', async function () {
    expect(application.items.systemSmartViews.length).to.be.above(0)
  })

  it('find tag by title', async function () {
    const tag = await createTag()

    expect(application.items.findTagByTitle(tag.title)).to.be.ok
  })

  it('find tag by title should be case insensitive', async function () {
    const tag = await createTag()

    expect(application.items.findTagByTitle(tag.title.toUpperCase())).to.be.ok
  })

  it('find or create tag by title', async function () {
    const title = 'foo'

    expect(await application.mutator.findOrCreateTagByTitle({ title: title })).to.be.ok
  })

  it('note count', async function () {
    await createNote()
    expect(application.items.noteCount).to.equal(1)
  })

  it('remove all items from memory', async function () {
    const observed = []
    application.items.addObserver(ContentType.TYPES.Any, ({ changed, inserted, removed, ignored }) => {
      observed.push({ changed, inserted, removed, ignored })
    })
    await createNote()
    await application.items.removeAllItemsFromMemory()

    const deletionEvent = observed[1]
    expect(deletionEvent.removed[0].deleted).to.equal(true)
    expect(application.items.items.length).to.equal(0)
  })

  it('remove item locally', async function () {
    const observed = []
    application.items.addObserver(ContentType.TYPES.Any, ({ changed, inserted, removed, ignored }) => {
      observed.push({ changed, inserted, removed, ignored })
    })
    const note = await createNote()
    await application.items.removeItemFromMemory(note)

    expect(observed.length).to.equal(1)
    expect(application.items.findItem(note.uuid)).to.not.be.ok
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
    application.items.addObserver(ContentType.TYPES.Note, ({ changed, inserted }) => {
      const all = changed.concat(inserted)
      if (!didEmit) {
        didEmit = true
        const changedPayload = payload.copy({
          content: {
            ...payload.content,
            title: changedTitle,
          },
        })
        application.mutator.emitItemFromPayload(changedPayload)
      }
      latestVersion = all[0]
    })
    await application.mutator.emitItemFromPayload(payload)
    expect(latestVersion.title).to.equal(changedTitle)
  })

  describe('searchTags', async function () {
    it('should return tag with query matching title', async function () {
      const tag = await application.mutator.findOrCreateTagByTitle({ title: 'tag' })

      const results = application.items.searchTags('tag')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return all tags with query partially matching title', async function () {
      const firstTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag one' })
      const secondTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag two' })

      const results = application.items.searchTags('tag')
      expect(results).lengthOf(2)
      expect(results[0].title).to.equal(firstTag.title)
      expect(results[1].title).to.equal(secondTag.title)
    })
    it('should be case insensitive', async function () {
      const tag = await application.mutator.findOrCreateTagByTitle({ title: 'Tag' })

      const results = application.items.searchTags('tag')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return tag with query matching delimiter separated component', async function () {
      const tag = await application.mutator.findOrCreateTagByTitle({ title: 'parent.child' })

      const results = application.items.searchTags('child')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })
    it('should return tags with matching query including delimiter', async function () {
      const tag = await application.mutator.findOrCreateTagByTitle({ title: 'parent.child' })

      const results = application.items.searchTags('parent.chi')
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(tag.title)
    })

    it('should return tags in natural order', async function () {
      const firstTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag 100' })
      const secondTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag 2' })
      const thirdTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag b' })
      const fourthTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag a' })

      const results = application.items.searchTags('tag')
      expect(results).lengthOf(4)
      expect(results[0].title).to.equal(secondTag.title)
      expect(results[1].title).to.equal(firstTag.title)
      expect(results[2].title).to.equal(fourthTag.title)
      expect(results[3].title).to.equal(thirdTag.title)
    })

    it('should not return tags associated with note', async function () {
      const firstTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag one' })
      const secondTag = await application.mutator.findOrCreateTagByTitle({ title: 'tag two' })

      const note = await createNote()
      await application.mutator.changeItem(firstTag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(note)
      })

      const results = application.items.searchTags('tag', note)
      expect(results).lengthOf(1)
      expect(results[0].title).to.equal(secondTag.title)
    })
  })

  describe('smart views', async function () {
    it('all view should not include archived notes by default', async function () {
      const normal = await createNote()

      await application.mutator.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      application.items.setPrimaryItemDisplayOptions({
        views: [application.items.allNotesSmartView],
      })

      expect(application.items.getDisplayableNotes().length).to.equal(0)
    })

    it('archived view should not include trashed notes by default', async function () {
      const normal = await createNote()

      await application.mutator.changeItem(normal, (mutator) => {
        mutator.archived = true
        mutator.trashed = true
      })

      application.items.setPrimaryItemDisplayOptions({
        views: [application.items.archivedSmartView],
      })

      expect(application.items.getDisplayableNotes().length).to.equal(0)
    })

    it('trashed view should include archived notes by default', async function () {
      const normal = await createNote()

      await application.mutator.changeItem(normal, (mutator) => {
        mutator.archived = true
        mutator.trashed = true
      })

      application.items.setPrimaryItemDisplayOptions({
        views: [application.items.trashSmartView],
      })

      expect(application.items.getDisplayableNotes().length).to.equal(1)
    })
  })

  describe('getSortedTagsForNote', async function () {
    it('should return tags associated with a note in natural order', async function () {
      const tags = [
        await application.mutator.findOrCreateTagByTitle({ title: 'tag 100' }),
        await application.mutator.findOrCreateTagByTitle({ title: 'tag 2' }),
        await application.mutator.findOrCreateTagByTitle({ title: 'tag b' }),
        await application.mutator.findOrCreateTagByTitle({ title: 'tag a' }),
      ]

      const note = await createNote()

      tags.map(async (tag) => {
        await application.mutator.changeItem(tag, (mutator) => {
          mutator.e2ePendingRefactor_addItemAsRelationship(note)
        })
      })

      const results = application.items.getSortedTagsForItem(note)

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
        application.mutator.findOrCreateTagByTitle({ title: 'parent' }),
        application.mutator.findOrCreateTagByTitle({ title: 'parent.child' }),
        application.mutator.findOrCreateTagByTitle({ title: 'parent.child.grandchild' }),
        application.mutator.findOrCreateTagByTitle({ title: 'some other tag' }),
      ])

      await application.mutator.setTagParent(parent, child)
      await application.mutator.setTagParent(child, grandchild)

      const results = application.items.getTagParentChain(grandchild)

      expect(results).lengthOf(2)
      expect(results[0].uuid).to.equal(parent.uuid)
      expect(results[1].uuid).to.equal(child.uuid)
    })
  })
})
