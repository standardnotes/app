/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
import * as Utils from '../lib/Utils.js'
import { createRelatedNoteTagPairPayload } from '../lib/Items.js'
import { BaseItemCounts } from '../lib/Applications.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('notes and tags', () => {
  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    this.expectedItemCount = BaseItemCounts.DefaultItems
    this.application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
  })

  it('uses proper class for note', async function () {
    const payload = Factory.createNotePayload()
    await this.application.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    expect(note.constructor === SNNote).to.equal(true)
  })

  it('properly constructs syncing params', async function () {
    const title = 'Foo'
    const text = 'Bar'
    const note = await this.application.mutator.createTemplateItem(ContentType.Note, {
      title,
      text,
    })

    expect(note.content.title).to.equal(title)
    expect(note.content.text).to.equal(text)

    const tag = await this.application.mutator.createTemplateItem(ContentType.Tag, {
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

    await this.application.itemManager.emitItemsFromPayloads([mutatedNote, mutatedTag], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    const tag = this.application.itemManager.getItems([ContentType.Tag])[0]

    expect(note.content.references.length).to.equal(1)
    expect(this.application.itemManager.itemsReferencingItem(tag).length).to.equal(1)
  })

  it('creates relationship between note and tag', async function () {
    const pair = createRelatedNoteTagPairPayload({ dirty: false })
    const notePayload = pair[0]
    const tagPayload = pair[1]

    expect(notePayload.content.references.length).to.equal(0)
    expect(tagPayload.content.references.length).to.equal(1)

    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getDisplayableNotes()[0]
    let tag = this.application.itemManager.getDisplayableTags()[0]

    expect(note.dirty).to.not.be.ok
    expect(tag.dirty).to.not.be.ok

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    expect(note.isReferencingItem(tag)).to.equal(false)
    expect(tag.isReferencingItem(note)).to.equal(true)

    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(1)
    expect(note.payload.references.length).to.equal(0)
    expect(tag.noteCount).to.equal(1)

    await this.application.itemManager.setItemToBeDeleted(note)

    tag = this.application.itemManager.getDisplayableTags()[0]

    const deletedNotePayload = this.application.payloadManager.findOne(note.uuid)
    expect(deletedNotePayload.dirty).to.be.true
    expect(tag.dirty).to.be.true

    await this.application.syncService.sync(syncOptions)

    expect(tag.content.references.length).to.equal(0)
    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)

    tag = this.application.itemManager.getDisplayableTags()[0]
    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(0)
    expect(tag.dirty).to.be.false
  })

  it('handles remote deletion of relationship', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await this.application.itemManager.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getItems([ContentType.Note])[0]
    let tag = this.application.itemManager.getItems([ContentType.Tag])[0]

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    await this.application.syncService.sync(syncOptions)

    const mutatedTag = new DecryptedPayload({
      ...tagPayload,
      dirty: false,
      content: {
        ...tagPayload.content,
        references: [],
      },
    })
    await this.application.itemManager.emitItemsFromPayloads([mutatedTag], PayloadEmitSource.LocalChanged)

    note = this.application.itemManager.findItem(note.uuid)
    tag = this.application.itemManager.findItem(tag.uuid)

    expect(tag.content.references.length).to.equal(0)
    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)

    // expect to be false
    expect(note.dirty).to.not.be.ok
    expect(tag.dirty).to.not.be.ok
  })

  it('creating basic note should have text set', async function () {
    const note = await Factory.createMappedNote(this.application)
    expect(note.title).to.be.ok
    expect(note.text).to.be.ok
  })

  it('creating basic tag should have title', async function () {
    const tag = await Factory.createMappedTag(this.application)
    expect(tag.title).to.be.ok
  })

  it('handles removing relationship between note and tag', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    let tag = this.application.itemManager.getItems([ContentType.Tag])[0]

    expect(note.content.references.length).to.equal(0)
    expect(tag.content.references.length).to.equal(1)

    tag = await this.application.mutator.changeAndSaveItem(
      tag,
      (mutator) => {
        mutator.removeItemAsRelationship(note)
      },
      undefined,
      undefined,
      syncOptions,
    )

    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(0)
    expect(tag.noteCount).to.equal(0)
  })

  it('properly handles tag duplication', async function () {
    const pair = createRelatedNoteTagPairPayload()
    await this.application.itemManager.emitItemsFromPayloads(pair, PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getDisplayableNotes()[0]
    let tag = this.application.itemManager.getDisplayableTags()[0]

    const duplicateTag = await this.application.itemManager.duplicateItem(tag, true)
    await this.application.syncService.sync(syncOptions)

    note = this.application.itemManager.findItem(note.uuid)
    tag = this.application.itemManager.findItem(tag.uuid)

    expect(tag.uuid).to.not.equal(duplicateTag.uuid)
    expect(tag.content.references.length).to.equal(1)
    expect(tag.noteCount).to.equal(1)
    expect(duplicateTag.content.references.length).to.equal(1)
    expect(duplicateTag.noteCount).to.equal(1)

    const noteTags = this.application.itemManager.itemsReferencingItem(note)
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
    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    const duplicateNote = await this.application.itemManager.duplicateItem(note, true)
    expect(note.uuid).to.not.equal(duplicateNote.uuid)

    expect(this.application.itemManager.itemsReferencingItem(duplicateNote).length).to.equal(
      this.application.itemManager.itemsReferencingItem(note).length,
    )
  })

  it('deleting a note should update tag references', async function () {
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]
    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    const note = this.application.itemManager.getItems([ContentType.Note])[0]
    let tag = this.application.itemManager.getItems([ContentType.Tag])[0]

    expect(tag.content.references.length).to.equal(1)
    expect(tag.noteCount).to.equal(1)

    expect(note.content.references.length).to.equal(0)
    expect(this.application.itemManager.itemsReferencingItem(note).length).to.equal(1)

    await this.application.itemManager.setItemToBeDeleted(tag)
    tag = this.application.itemManager.findItem(tag.uuid)
    expect(tag).to.not.be.ok
  })

  it('modifying item content should not modify payload content', async function () {
    const notePayload = Factory.createNotePayload()
    await this.application.itemManager.emitItemsFromPayloads([notePayload], PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getItems([ContentType.Note])[0]
    note = await this.application.mutator.changeAndSaveItem(
      note,
      (mutator) => {
        mutator.mutableContent.title = Math.random()
      },
      undefined,
      undefined,
      syncOptions,
    )
    expect(note.content.title).to.not.equal(notePayload.content.title)
  })

  it('deleting a tag should not dirty notes', async function () {
    // Tags now reference notes, but it used to be that tags referenced notes and notes referenced tags.
    // After the change, there was an issue where removing an old tag relationship from a note would only
    // remove one way, and thus keep it intact on the visual level.
    const pair = createRelatedNoteTagPairPayload()
    const notePayload = pair[0]
    const tagPayload = pair[1]

    await this.application.itemManager.emitItemsFromPayloads([notePayload, tagPayload], PayloadEmitSource.LocalChanged)
    let note = this.application.itemManager.getItems([ContentType.Note])[0]
    let tag = this.application.itemManager.getItems([ContentType.Tag])[0]

    await this.application.syncService.sync(syncOptions)
    await this.application.itemManager.setItemToBeDeleted(tag)

    note = this.application.itemManager.findItem(note.uuid)
    this.application.itemManager.findItem(tag.uuid)

    expect(note.dirty).to.not.be.ok
  })

  it('should sort notes', async function () {
    await Promise.all(
      ['Y', 'Z', 'A', 'B'].map(async (title) => {
        return this.application.mutator.insertItem(
          await this.application.mutator.createTemplateItem(ContentType.Note, { title }),
        )
      }),
    )
    this.application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
    })
    const titles = this.application.items.getDisplayableNotes().map((note) => note.title)
    /** setPrimaryItemDisplayOptions inverses sort for title */
    expect(titles).to.deep.equal(['A', 'B', 'Y', 'Z'])
  })

  it('setting a note dirty should collapse its properties into content', async function () {
    let note = await this.application.mutator.createTemplateItem(ContentType.Note, {
      title: 'Foo',
    })
    await this.application.mutator.insertItem(note)
    note = this.application.itemManager.findItem(note.uuid)
    expect(note.content.title).to.equal('Foo')
  })

  describe('Tags', function () {
    it('should sort tags in ascending alphabetical order by default', async function () {
      const titles = ['1', 'A', 'b', '2']
      const sortedTitles = titles.sort((a, b) => a.localeCompare(b))
      await Promise.all(titles.map((title) => this.application.mutator.findOrCreateTag(title)))
      expect(this.application.items.tagDisplayController.items().map((t) => t.title)).to.deep.equal(sortedTitles)
    })

    it('should match a tag', async function () {
      const taggedNote = await Factory.createMappedNote(this.application)
      const tag = await this.application.mutator.findOrCreateTag('A')
      await this.application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes.length).to.equal(1)
      expect(displayedNotes[0].uuid).to.equal(taggedNote.uuid)
    })

    it('should not show trashed notes when displaying a tag', async function () {
      const taggedNote = await Factory.createMappedNote(this.application)
      const trashedNote = await Factory.createMappedNote(this.application)
      const tag = await this.application.mutator.findOrCreateTag('A')
      await this.application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
        mutator.e2ePendingRefactor_addItemAsRelationship(trashedNote)
      })
      await this.application.mutator.changeItem(trashedNote, (mutator) => {
        mutator.trashed = true
      })
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
        includeTrashed: false,
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes.length).to.equal(1)
      expect(displayedNotes[0].uuid).to.equal(taggedNote.uuid)
    })

    it('should sort notes when displaying tag', async function () {
      await Promise.all(
        ['Y', 'Z', 'A', 'B'].map(async (title) => {
          return this.application.mutator.insertItem(
            await this.application.mutator.createTemplateItem(ContentType.Note, {
              title,
            }),
          )
        }),
      )
      const pinnedNote = this.application.itemManager.getDisplayableNotes().find((note) => note.title === 'B')
      await this.application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })
      const tag = await this.application.mutator.findOrCreateTag('A')
      await this.application.mutator.changeItem(tag, (mutator) => {
        for (const note of this.application.itemManager.getDisplayableNotes()) {
          mutator.e2ePendingRefactor_addItemAsRelationship(note)
        }
      })

      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'dsc',
        tags: [tag],
      })

      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.have.length(4)
      /** setPrimaryItemDisplayOptions inverses sort for title */
      expect(displayedNotes[0].title).to.equal('B')
      expect(displayedNotes[1].title).to.equal('A')
    })
  })

  describe('Smart views', function () {
    it('"title", "startsWith", "Foo"', async function () {
      const note = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'Foo 🎲',
        }),
      )
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'Not Foo 🎲',
        }),
      )
      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'Foo Notes',
          predicate: {
            keypath: 'title',
            operator: 'startsWith',
            value: 'Foo',
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(note.uuid)
    })

    it('"pinned", "=", true', async function () {
      const note = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(note, (mutator) => {
        mutator.pinned = true
      })
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'B',
          pinned: false,
        }),
      )
      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'Pinned',
          predicate: {
            keypath: 'pinned',
            operator: '=',
            value: true,
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(note.uuid)
    })

    it('"pinned", "=", false', async function () {
      const pinnedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })
      const unpinnedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'B',
        }),
      )
      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'Not pinned',
          predicate: {
            keypath: 'pinned',
            operator: '=',
            value: false,
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })

      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(unpinnedNote.uuid)
    })

    it('"text.length", ">", 500', async function () {
      const longNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
          text: Array(501).fill(0).join(''),
        }),
      )
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'B',
          text: 'b',
        }),
      )
      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'Long',
          predicate: {
            keypath: 'text.length',
            operator: '>',
            value: 500,
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(longNote.uuid)
    })

    it('"updated_at", ">", "1.days.ago"', async function () {
      await Factory.registerUserToApplication({
        application: this.application,
        email: Utils.generateUuid(),
        password: Utils.generateUuid(),
      })

      const recentNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )

      await this.application.sync.sync()

      const olderNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'B',
          text: 'b',
        }),
      )

      const threeDays = 3 * 24 * 60 * 60 * 1000
      await Factory.changePayloadUpdatedAt(this.application, olderNote.payload, new Date(Date.now() - threeDays))

      /** Create an unsynced note which shouldn't get an updated_at */
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'B',
          text: 'b',
        }),
      )
      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'One day ago',
          predicate: {
            keypath: 'serverUpdatedAt',
            operator: '>',
            value: '1.days.ago',
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(recentNote.uuid)
    })

    it('"tags.length", "=", 0', async function () {
      const untaggedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      const taggedNote = await Factory.createMappedNote(this.application)
      const tag = await this.application.mutator.findOrCreateTag('A')
      await this.application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })

      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'Untagged',
          predicate: {
            keypath: 'tags.length',
            operator: '=',
            value: 0,
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(untaggedNote.uuid)
    })

    it('"tags", "includes", ["title", "startsWith", "b"]', async function () {
      const taggedNote = await Factory.createMappedNote(this.application)
      const tag = await this.application.mutator.findOrCreateTag('B')
      await this.application.mutator.changeItem(tag, (mutator) => {
        mutator.e2ePendingRefactor_addItemAsRelationship(taggedNote)
      })
      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )

      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
          title: 'B-tags',
          predicate: {
            keypath: 'tags',
            operator: 'includes',
            value: { keypath: 'title', operator: 'startsWith', value: 'B' },
          },
        }),
      )
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(taggedNote.uuid)
    })

    it('"ignored", "and", [["pinned", "=", true], ["locked", "=", true]]', async function () {
      const pinnedAndLockedNote = await Factory.createMappedNote(this.application)
      await this.application.mutator.changeItem(pinnedAndLockedNote, (mutator) => {
        mutator.pinned = true
        mutator.locked = true
      })

      const pinnedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })

      const lockedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(lockedNote, (mutator) => {
        mutator.locked = true
      })

      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
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
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
      expect(displayedNotes).to.deep.equal(matches)
      expect(matches.length).to.equal(1)
      expect(matches[0].uuid).to.equal(pinnedAndLockedNote.uuid)
    })

    it('"ignored", "or", [["content.protected", "=", true], ["pinned", "=", true]]', async function () {
      const protectedNote = await Factory.createMappedNote(this.application)
      await this.application.mutator.changeItem(protectedNote, (mutator) => {
        mutator.protected = true
      })

      const pinnedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(pinnedNote, (mutator) => {
        mutator.pinned = true
      })

      const pinnedAndProtectedNote = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )
      await this.application.mutator.changeItem(pinnedAndProtectedNote, (mutator) => {
        mutator.pinned = true
        mutator.protected = true
      })

      await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.Note, {
          title: 'A',
        }),
      )

      const view = await this.application.mutator.insertItem(
        await this.application.mutator.createTemplateItem(ContentType.SmartView, {
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
      const matches = this.application.items.notesMatchingSmartView(view)
      this.application.items.setPrimaryItemDisplayOptions({
        sortBy: 'created_at',
        sortDirection: 'asc',
        views: [view],
      })
      const displayedNotes = this.application.items.getDisplayableNotes()
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

    await this.application.itemManager.emitItemsFromPayloads(
      [notePayload1, notePayload2, notePayload3, notePayload4, tagPayload1],
      PayloadEmitSource.LocalChanged,
    )

    this.application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
      searchQuery: {
        query: 'Test',
      },
    })

    const displayedNotes = this.application.items.getDisplayableNotes()
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

    await this.application.itemManager.emitItemsFromPayloads(
      [notePayload1, notePayload2, notePayload3, notePayload4, tagPayload1],
      PayloadEmitSource.LocalChanged,
    )

    this.application.items.setPrimaryItemDisplayOptions({
      sortBy: 'title',
      sortDirection: 'dsc',
      searchQuery: {
        query: 'foo',
      },
    })

    const displayedNotes = this.application.items.getDisplayableNotes()
    expect(displayedNotes.length).to.equal(3)
    /** setPrimaryItemDisplayOptions inverses sort for title */
    expect(displayedNotes[0].uuid).to.equal(notePayload1.uuid)
    expect(displayedNotes[1].uuid).to.equal(notePayload2.uuid)
    expect(displayedNotes[2].uuid).to.equal(notePayload3.uuid)
  })
})
