import * as Factory from '../lib/factory.js'
import * as Utils from '../lib/Utils.js'
import { createRelatedNoteTagPairPayload } from '../lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('notes and tags', () => {
  let application
  let context

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    localStorage.clear()
    context = await Factory.createAppContext()
    await context.launch()
    application = context.application
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
    context = undefined
  })

  it('uses proper class for note', async function () {
    const payload = Factory.createNotePayload()
    await application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    expect(note.constructor === SNNote).to.equal(true)
  })

  it('properly constructs syncing params', async function () {
    const title = 'Foo'
    const text = 'Bar'
    const note = await application.items.createTemplateItem(ContentType.TYPES.Note, {
      title,
      text,
    })

    expect(note.content.title).to.equal(title)
    expect(note.content.text).to.equal(text)

    const tag = await application.items.createTemplateItem(ContentType.TYPES.Tag, {
      title,
    })

    expect(tag.title).to.equal(title)
  })

  it('properly handles legacy relationships', async function () {
    // legacy relationships are when a note has a reference to a tag
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    const mutatedTag = new DecryptedPayload({
      ...tagPayload,
      content: {
        ...tagPayload.content,
        references: null,
      },
    })
    const mutatedNote = new DecryptedPayload({
      ...notePayload,
      content: {
        references: [
          {
            uuid: tagPayload.uuid,
            content_type: tagPayload.content_type,
          },
        ],
      },
    })

    await application.mutator.emitItemsFromPayloads([mutatedNote, mutatedTag], PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    const tag = application.items.getItems([ContentType.TYPES.Tag])[0]

    expect(note.content.references.length).to.equal(1)
    expect(application.items.itemsReferencingItem(tag).length).to.equal(1)
  })

  it('creates relationship between note and tag', async function () {
    const pair = createRelatedNoteTagPairPayload({ dirty: false })
    const notePayload = pair[0]
    const tagPayload = pair[1]

    expect(notePayload.content.references.length).to.equal(0)
    expect(tagPayload.content.references.length).to.equal(1)

    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = application.items.getDisplayableNotes()[0]
    let tag = application.items.getDisplayableTags()[0]

    expect(note.dirty).to.not.be.ok
    expect(tag.dirty).to.not.be.ok

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    expect(note.isReferencingItem(tag)).to.equal(false)
    expect(tag.isReferencingItem(note)).to.equal(true)

    expect(application.items.itemsReferencingItem(note).length).to.equal(1)
    expect(note.payload.references.length).to.equal(0)
    expect(tag.noteCount).to.equal(1)

    await application.mutator.setItemToBeDeleted(note)

    tag = application.items.getDisplayableTags()[0]

    const deletedNotePayload = application.payloads.findOne(note.uuid)
    expect(deletedNotePayload.dirty).to.be.true
    expect(tag.dirty).to.be.true

    await application.sync.sync(syncOptions)

    expect(tag.content.references.length).to.equal(0)
    expect(application.items.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)

    tag = application.items.getDisplayableTags()[0]
    expect(application.items.getDisplayableNotes().length).to.equal(0)
    expect(tag.dirty).to.be.false
  })

  it('handles remote deletion of relationship', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await application.mutator.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
    let note = application.items.getItems([ContentType.TYPES.Note])[0]
    let tag = application.items.getItems([ContentType.TYPES.Tag])[0]

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    await application.sync.sync(syncOptions)

    const mutatedTag = new DecryptedPayload({
      ...tagPayload,
      dirty: false,
      content: {
        ...tagPayload.content,
        references: [],
      },
    })
    await application.mutator.emitItemsFromPayloads([mutatedTag], PayloadEmitSource.LocalChanged)

    note = application.items.findItem(note.uuid)
    tag = application.items.findItem(tag.uuid)

    expect(tag.content.references.length).to.equal(0)
    expect(application.items.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)

    // expect to be false
    expect(note.dirty).to.not.be.ok
    expect(tag.dirty).to.not.be.ok
  })

  it('creating basic note should have text set', async function () {
    const note = await Factory.createMappedNote(application)
    expect(note.title).to.be.ok
    expect(note.text).to.be.ok
  })

  it('creating basic tag should have title', async function () {
    const tag = await Factory.createMappedTag(application)
    expect(tag.title).to.be.ok
  })

  it('handles removing relationship between note and tag', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    let tag = application.items.getItems([ContentType.TYPES.Tag])[0]

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    tag = (
      await application.changeAndSaveItem.execute(
        tag,
        (mutator) => {
          mutator.removeItemAsRelationship(note)
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()

    expect(application.items.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)
  })

  it('properly handles tag duplication', async function () {
    const pair = createRelatedNoteTagPairPayload()
    await application.mutator.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
    let note = application.items.getDisplayableNotes()[0]
    let tag = application.items.getDisplayableTags()[0]

    const duplicateTag = await application.mutator.duplicateItem(tag, true)
    await application.sync.sync(syncOptions)

    note = application.items.findItem(note.uuid)
    tag = application.items.findItem(tag.uuid)

    expect(tag.uuid).to.not.equal(duplicateTag.uuid)
    expect(tag.content.references.length).to.equal(1)
    expect(tag.noteCount).to.equal(1)
    expect(duplicateTag.content.references.length).to.equal(1)
    expect(duplicateTag.noteCount).to.equal(1)

    const noteTags = application.items.itemsReferencingItem(note)
    expect(noteTags.length).to.equal(2)

    const noteTag1 = noteTags[0]
    const noteTag2 = noteTags[1]
    expect(noteTag1.uuid).to.not.equal(noteTag2.uuid)

    // expect to be false
    expect(note.dirty).to.not.be.ok
    expect(tag.dirty).to.not.be.ok
  })

  it('duplicating a note should maintain its tag references', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    const duplicateNote = await application.mutator.duplicateItem(note, true)
    expect(note.uuid).to.not.equal(duplicateNote.uuid)

    expect(application.items.itemsReferencingItem(duplicateNote).length).to.equal(
      application.items.itemsReferencingItem(note).length,
    )
  })

  it('deleting a note should update tag references', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = application.items.getItems([ContentType.TYPES.Note])[0]
    let tag = application.items.getItems([ContentType.TYPES.Tag])[0]

    expect(tag.content.references.length).to.equal(1)
    expect(tag.noteCount).to.equal(1)

    expect(note.content.references.length).to.equal(0)
    expect(application.items.itemsReferencingItem(note).length).to.equal(1)

    await application.mutator.setItemToBeDeleted(tag)
    tag = application.items.findItem(tag.uuid)
    expect(tag).to.not.be.ok
  })

  it('modifying item content should not modify payload content', async function () {
    const notePayload = Factory.createNotePayload()
    await application.mutator.emitItemsFromPayloads([notePayload], PayloadEmitSource.LocalChanged)
    let note = application.items.getItems([ContentType.TYPES.Note])[0]
    note = (
      await application.changeAndSaveItem.execute(
        note,
        (mutator) => {
          mutator.mutableContent.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
    ).getValue()
    expect(note.content.title).to.not.equal(notePayload.content.title)
  })

  it('deleting a tag should not dirty notes', async function () {
    // Tags now reference notes, but it used to be that tags referenced notes and notes referenced tags.
    // After the change, there was an issue where removing an old tag relationship from a note would only
    // remove one way, and thus keep it intact on the visual level.
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await application.mutator.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = application.items.getItems([ContentType.TYPES.Note])[0]
    let tag = application.items.getItems([ContentType.TYPES.Tag])[0]

    await application.sync.sync(syncOptions)
    await application.mutator.setItemToBeDeleted(tag)

    note = application.items.findItem(note.uuid)
    application.items.findItem(tag.uuid)

    expect(note.dirty).to.not.be.ok
  })

  it('should sort notes', async function () {
    await Promise.all(
      ['Y', 'Z', 'A', 'B'].map(async (title) => {
        return application.mutator.insertItem(
          await application.items.createTemplateItem(ContentType.TYPES.Note, { title }),
        )
      }),
    )
    application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
    })
    const titles = application.items.getDisplayableNotes().map((note) => note.title)
    /** setPrimaryItemDisplayOptions inverses sort for title */
    expect(titles).to.deep.equal(['A', 'B', 'Y', 'Z'])
  })

  it('setting a note dirty should collapse its properties into content', async function () {
    let note = await application.items.createTemplateItem(ContentType.TYPES.Note, {
      title: 'Foo',
    })
    await application.mutator.insertItem(note)
    note = application.items.findItem(note.uuid)
    expect(note.content.title).to.equal('Foo')
  })

  describe('Tags', function () {
    it('should sort tags in ascending alphabetical order by default', async function () {
      const titles = ['1', 'A', 'b', '2']
      const sortedTitles = titles.sort((a, b) => a.localeCompare(b))
      await Promise.all(titles.map((title) => application.mutator.findOrCreateTag(title)))
      expect(application.items.tagDisplayController.items().map((t) => t.title)).to.deep.equal(sortedTitles)
    })

    it('should match a tag', async function () {
      const taggedNote = await Factory.createMappedNote(application)
      const tag = await application.mutator.findOrCreateTag('A')
      await application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes.length).to.equal(1)
      expect(displayedNotes[0].uuid).to.equal(taggedNote.uuid)
    })

    it('should not show trashed notes when displaying a tag', async function () {
      const taggedNote = await Factory.createMappedNote(application)
      const trashedNote = await Factory.createMappedNote(application)
      const tag = await application.mutator.findOrCreateTag('A')
      await application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
        mutator.e2ePendingRefactor_addItemAsRelationship(trashedNote)
      })
      await application.mutator.changeItem(trashedNote, (mutator) => {
        mutator.trashed = true
      })
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
        includeTrashed: false,
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes.length).to.equal(1)
      expect(displayedNotes[0].uuid).to.equal(taggedNote.uuid)
    })

    it('should sort notes when displaying tag', async function () {
      await Promise.all(
        ['Y', 'Z', 'A', 'B'].map(async (title) => {
          return application.mutator.insertItem(
            await application.items.createTemplateItem(ContentType.TYPES.Note, {
              title,
            }),
          )
        }),
      )
      const pinnedNote = application.items.getDisplayableNotes().find((note) => note.title === 'B')
      await application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })
      const tag = await application.mutator.findOrCreateTag('A')
      await application.mutator.changeItem(tag, (mutator) => {
        for (const note of application.items.getDisplayableNotes()) {
          mutator.e2ePendingRefactor_addItemAsRelationship(note)
        }
      })

      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
      })

      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.have.length(4)
      /** setPrimaryItemDisplayOptions inverses sort for title */
      expect(displayedNotes[0].title).to.equal('B')
      expect(displayedNotes[1].title).to.equal('A')
    })
  })

  describe('Smart views', function () {
    it('"title", "startsWith", "Foo"', async function () {
      const note = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'Foo 🎲',
        }),
      )
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'Not Foo 🎲',
        }),
      )
      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Foo Notes',
          predicate: {
            keypath: 'title',
            operator: 'startsWith',
            value: 'Foo',
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(note.uuid)
    })

    it('"pinned", "=", true', async function () {
      const note = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(note, (mutator) => {
        mutator.pinned = true
      })
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'B',
          pinned: false,
        }),
      )
      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Pinned',
          predicate: {
            keypath: 'pinned',
            operator: '=',
            value: true,
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(note.uuid)
    })

    it('"pinned", "=", false', async function () {
      const pinnedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })
      const unpinnedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'B',
        }),
      )
      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Not pinned',
          predicate: {
            keypath: 'pinned',
            operator: '=',
            value: false,
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(unpinnedNote.uuid)
    })

    it('"text.length", ">", 500', async function () {
      const longNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
          text: Array(501).fill(0).join(''),
        }),
      )
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'B',
          text: 'b',
        }),
      )
      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Long',
          predicate: {
            keypath: 'text.length',
            operator: '>',
            value: 500,
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(longNote.uuid)
    })

    it('"updated_at", ">", "1.days.ago"', async function () {
      await Factory.registerUserToApplication({
        application: application,
        email: Utils.generateUuid(),
        password: Utils.generateUuid(),
      })

      const recentNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
        true,
      )

      await application.sync.sync()

      const olderNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'B',
          text: 'b',
        }),
        true,
      )

      const threeDays = 3 * 24 * 60 * 60 * 1000
      await Factory.changePayloadUpdatedAt(application, olderNote.payload, new Date(Date.now() - threeDays))

      /** Create an unsynced note which shouldn't get an updated_at */
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'B',
          text: 'b',
        }),
      )
      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'One day ago',
          predicate: {
            keypath: 'serverUpdatedAt',
            operator: '>',
            value: '1.days.ago',
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(recentNote.uuid)

      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
    })

    it('"tags.length", "=", 0', async function () {
      const untaggedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      const taggedNote = await Factory.createMappedNote(application)
      const tag = await application.mutator.findOrCreateTag('A')
      await application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })

      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Untagged',
          predicate: {
            keypath: 'tags.length',
            operator: '=',
            value: 0,
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(untaggedNote.uuid)
    })

    it('"tags", "includes", ["title", "startsWith", "b"]', async function () {
      const taggedNote = await Factory.createMappedNote(application)
      const tag = await application.mutator.findOrCreateTag('B')
      await application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })
      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )

      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'B-tags',
          predicate: {
            keypath: 'tags',
            operator: 'includes',
            value: { keypath: 'title', operator: 'startsWith', value: 'B' },
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(taggedNote.uuid)
    })

    it('"ignored", "and", [["pinned", "=", true], ["locked", "=", true]]', async function () {
      const pinnedAndLockedNote = await Factory.createMappedNote(application)
      await application.mutator.changeItem(pinnedAndLockedNote, (mutator) => {
        mutator.pinned = true
        mutator.locked = true
      })

      const pinnedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })

      const lockedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(lockedNote, (mutator) => {
        mutator.locked = true
      })

      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Pinned & Locked',
          predicate: {
            operator: 'and',
            value: [
              { keypath: 'pinned', operator: '=', value: true },
              { keypath: 'locked', operator: '=', value: true },
            ],
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(pinnedAndLockedNote.uuid)
    })

    it('"ignored", "or", [["content.protected", "=", true], ["pinned", "=", true]]', async function () {
      const protectedNote = await Factory.createMappedNote(application)
      await application.mutator.changeItem(protectedNote, (mutator) => {
        mutator.protected = true
      })

      const pinnedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })

      const pinnedAndProtectedNote = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )
      await application.mutator.changeItem(pinnedAndProtectedNote, (mutator) => {
        mutator.pinned = true
        mutator.protected = true
      })

      await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.Note, {
          title: 'A',
        }),
      )

      const view = await application.mutator.insertItem(
        await application.items.createTemplateItem(ContentType.TYPES.SmartView, {
          title: 'Protected or Pinned',
          predicate: {
            operator: 'or',
            value: [
              { keypath: 'content.protected', operator: '=', value: true },
              { keypath: 'pinned', operator: '=', value: true },
            ],
          },
        }),
      )
      const matches = application.items.notesMatchingSmartView(view)
      application.items.setPrimaryItemDisplayOptions({
        sortBy: 'created_at',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = application.items.getDisplayableNotes()
      expect(displayedNotes.length).to.equal(matches.length)
      expect(matches.length).to.equal(3)
      expect(matches.find((note) => note.uuid === protectedNote.uuid)).to.exist
      expect(matches.find((note) => note.uuid === pinnedNote.uuid)).to.exist
      expect(matches.find((note) => note.uuid === pinnedAndProtectedNote.uuid)).to.exist
    })
  })

  it('include notes that have tag titles that match search query', async function () {
    const [notePayload1, tagPayload1] = createRelatedNoteTagPairPayload({
      noteTitle: 'A simple note',
      noteText: 'This is just a note.',
      tagTitle: 'Test',
    })
    const notePayload2 = Factory.createNotePayload('Foo')
    const notePayload3 = Factory.createNotePayload('Bar')
    const notePayload4 = Factory.createNotePayload('Testing')

    await application.mutator.emitItemsFromPayloads(
      [notePayload1, notePayload2, notePayload3, notePayload4, tagPayload1],
      PayloadEmitSource.LocalChanged,
    )

    application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
      searchQuery: {
        query: 'Test',
      },
    })

    const displayedNotes = application.items.getDisplayableNotes()
    expect(displayedNotes.length).to.equal(2)
    /** setPrimaryItemDisplayOptions inverses sort for title */
    expect(displayedNotes[0].uuid).to.equal(notePayload1.uuid)
    expect(displayedNotes[1].uuid).to.equal(notePayload4.uuid)
  })

  it('search query should be case insensitive and match notes and tags title', async function () {
    const [notePayload1, tagPayload1] = createRelatedNoteTagPairPayload({
      noteTitle: 'A simple note',
      noteText: 'Just a note. Nothing to see.',
      tagTitle: 'Foo',
    })
    const notePayload2 = Factory.createNotePayload('Another bar (foo)')
    const notePayload3 = Factory.createNotePayload('Testing FOO (Bar)')
    const notePayload4 = Factory.createNotePayload('This should not match')

    await application.mutator.emitItemsFromPayloads(
      [notePayload1, notePayload2, notePayload3, notePayload4, tagPayload1],
      PayloadEmitSource.LocalChanged,
    )

    application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
      searchQuery: {
        query: 'foo',
      },
    })

    const displayedNotes = application.items.getDisplayableNotes()
    expect(displayedNotes.length).to.equal(3)
    /** setPrimaryItemDisplayOptions inverses sort for title */
    expect(displayedNotes[0].uuid).to.equal(notePayload1.uuid)
    expect(displayedNotes[1].uuid).to.equal(notePayload2.uuid)
    expect(displayedNotes[2].uuid).to.equal(notePayload3.uuid)
  })
})
