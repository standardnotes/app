import { ContentType } from '@standardnotes/domain-core'
import { AlertService, InternalEventBusInterface, ItemRelationshipDirection } from '@standardnotes/services'
import { ItemManager } from './ItemManager'
import { PayloadManager } from '../Payloads/PayloadManager'
import { LoggerInterface, UuidGenerator, assert } from '@standardnotes/utils'
import * as Models from '@standardnotes/models'
import {
  DecryptedPayload,
  DeletedPayload,
  EncryptedPayload,
  FillItemContent,
  PayloadTimestampDefaults,
  NoteContent,
  SmartView,
  SystemViewId,
} from '@standardnotes/models'
import { createNoteWithTitle } from '../../Spec/SpecUtils'
import { MutatorService } from '../Mutator'

const setupRandomUuid = () => {
  UuidGenerator.SetGenerator(() => String(Math.random()))
}

const VIEW_NOT_PINNED = '!["Not Pinned", "pinned", "=", false]'
const VIEW_LAST_DAY = '!["Last Day", "updated_at", ">", "1.days.ago"]'
const VIEW_LONG = '!["Long", "text.length", ">", 500]'

const NotPinnedPredicate = Models.predicateFromJson<Models.SNTag>({
  keypath: 'pinned',
  operator: '=',
  value: false,
})

const LastDayPredicate = Models.predicateFromJson<Models.SNTag>({
  keypath: 'updated_at',
  operator: '>',
  value: '1.days.ago',
})

const LongTextPredicate = Models.predicateFromJson<Models.SNTag>({
  keypath: 'text.length' as never,
  operator: '>',
  value: 500,
})

describe('itemManager', () => {
  let mutator: MutatorService
  let payloadManager: PayloadManager
  let itemManager: ItemManager
  let internalEventBus: InternalEventBusInterface
  let logger: LoggerInterface

  beforeEach(() => {
    setupRandomUuid()

    logger = {} as jest.Mocked<LoggerInterface>
    logger.debug = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()

    payloadManager = new PayloadManager(logger, internalEventBus)
    itemManager = new ItemManager(payloadManager, internalEventBus)

    mutator = new MutatorService(itemManager, payloadManager, {} as jest.Mocked<AlertService>, internalEventBus)
  })

  const createTag = (title: string) => {
    return new Models.SNTag(
      new Models.DecryptedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.TYPES.Tag,
        content: Models.FillItemContent<Models.TagContent>({
          title: title,
        }),
        ...PayloadTimestampDefaults(),
      }),
    )
  }

  const createFile = (name: string) => {
    return new Models.FileItem(
      new Models.DecryptedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.TYPES.File,
        content: Models.FillItemContent<Models.FileContent>({
          name: name,
        }),
        ...PayloadTimestampDefaults(),
      }),
    )
  }

  describe('item emit', () => {
    it('deleted payloads should map to removed items', async () => {
      const payload = new DeletedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.TYPES.Note,
        content: undefined,
        deleted: true,
        dirty: true,
        ...PayloadTimestampDefaults(),
      })

      const mockFn = jest.fn()

      itemManager['notifyObservers'] = mockFn

      await payloadManager.emitPayload(payload, Models.PayloadEmitSource.LocalInserted)

      expect(mockFn.mock.calls[0][2]).toHaveLength(1)
    })

    it('decrypted items who become encrypted should be removed from ui', async () => {
      const decrypted = new DecryptedPayload({
        uuid: String(Math.random()),
        content_type: ContentType.TYPES.Note,
        content: FillItemContent<NoteContent>({
          title: 'foo',
        }),
        ...PayloadTimestampDefaults(),
      })

      await payloadManager.emitPayload(decrypted, Models.PayloadEmitSource.LocalInserted)

      const encrypted = new EncryptedPayload({
        ...decrypted,
        content: '004:...',
        enc_item_key: '004:...',
        items_key_id: '123',
        waitingForKey: true,
        errorDecrypting: true,
      })

      const mockFn = jest.fn()

      itemManager['notifyObservers'] = mockFn

      await payloadManager.emitPayload(encrypted, Models.PayloadEmitSource.LocalInserted)

      expect(mockFn.mock.calls[0][2]).toHaveLength(1)
    })
  })

  describe('note display criteria', () => {
    it('viewing notes with tag', async () => {
      const tag = createTag('parent')
      const note = createNoteWithTitle('note')
      await mutator.insertItems([tag, note])
      await mutator.addTagToNote(note, tag, false)

      itemManager.setPrimaryItemDisplayOptions({
        tags: [tag],
        sortBy: 'title',
        sortDirection: 'asc',
      })

      const notes = itemManager.getDisplayableNotes()
      expect(notes).toHaveLength(1)
    })

    it('viewing trashed notes smart view should include archived notes', async () => {
      const archivedNote = createNoteWithTitle('archived')
      const trashedNote = createNoteWithTitle('trashed')
      const archivedAndTrashedNote = createNoteWithTitle('archived&trashed')

      await mutator.insertItems([archivedNote, trashedNote, archivedAndTrashedNote])

      await mutator.changeItem<Models.NoteMutator>(archivedNote, (m) => {
        m.archived = true
      })
      await mutator.changeItem<Models.NoteMutator>(trashedNote, (m) => {
        m.trashed = true
      })
      await mutator.changeItem<Models.NoteMutator>(archivedAndTrashedNote, (m) => {
        m.trashed = true
        m.archived = true
      })

      itemManager.setPrimaryItemDisplayOptions({
        sortBy: 'title',
        sortDirection: 'asc',
        includeArchived: false,
        includeTrashed: false,
        views: [{ uuid: SystemViewId.TrashedNotes } as jest.Mocked<SmartView>],
      })

      const notes = itemManager.getDisplayableNotes()

      expect(notes).toHaveLength(2)
    })
  })

  describe('tag relationships', () => {
    it('updates parentId of child tag', async () => {
      const parent = createTag('parent')
      const child = createTag('child')
      await mutator.insertItems([parent, child])
      await mutator.setTagParent(parent, child)

      const changedChild = itemManager.findItem(child.uuid) as Models.SNTag
      expect(changedChild.parentId).toBe(parent.uuid)
    })

    it('forbids a tag to be its own parent', async () => {
      const tag = createTag('tag')
      await mutator.insertItems([tag])

      await expect(mutator.setTagParent(tag, tag)).rejects.toThrow()
      expect(itemManager.getTagParent(tag)).toBeUndefined()
    })

    it('forbids a tag to be its own ancestor', async () => {
      const grandParent = createTag('grandParent')
      const parent = createTag('parent')
      const child = createTag('child')

      await mutator.insertItems([child, parent, grandParent])
      await mutator.setTagParent(parent, child)
      await mutator.setTagParent(grandParent, parent)

      await expect(mutator.setTagParent(child, grandParent)).rejects.toThrow()
      expect(itemManager.getTagParent(grandParent)).toBeUndefined()
    })

    it('getTagParent', async () => {
      const parent = createTag('parent')
      const child = createTag('child')
      await mutator.insertItems([parent, child])
      await mutator.setTagParent(parent, child)

      expect(itemManager.getTagParent(child)?.uuid).toBe(parent.uuid)
    })

    it('findTagByTitleAndParent', async () => {
      const parent = createTag('name1')
      const child = createTag('childName')
      const duplicateNameChild = createTag('name1')

      await mutator.insertItems([parent, child, duplicateNameChild])
      await mutator.setTagParent(parent, child)
      await mutator.setTagParent(parent, duplicateNameChild)

      const a = itemManager.findTagByTitleAndParent('name1', undefined)
      const b = itemManager.findTagByTitleAndParent('name1', parent)
      const c = itemManager.findTagByTitleAndParent('name1', child)

      expect(a?.uuid).toEqual(parent.uuid)
      expect(b?.uuid).toEqual(duplicateNameChild.uuid)
      expect(c?.uuid).toEqual(undefined)
    })

    it('findOrCreateTagByTitle', async () => {
      setupRandomUuid()

      const parent = createTag('parent')
      const child = createTag('child')
      await mutator.insertItems([parent, child])
      await mutator.setTagParent(parent, child)

      const childA = await mutator.findOrCreateTagByTitle({ title: 'child' })
      const childB = await mutator.findOrCreateTagByTitle({ title: 'child', parentItemToLookupUuidFor: parent })
      const childC = await mutator.findOrCreateTagByTitle({ title: 'child-bis', parentItemToLookupUuidFor: parent })
      const childD = await mutator.findOrCreateTagByTitle({ title: 'child-bis', parentItemToLookupUuidFor: parent })

      expect(childA.uuid).not.toEqual(child.uuid)
      expect(childB.uuid).toEqual(child.uuid)
      expect(childD.uuid).toEqual(childC.uuid)

      expect(itemManager.getTagParent(childA)?.uuid).toBe(undefined)
      expect(itemManager.getTagParent(childB)?.uuid).toBe(parent.uuid)
      expect(itemManager.getTagParent(childC)?.uuid).toBe(parent.uuid)
      expect(itemManager.getTagParent(childD)?.uuid).toBe(parent.uuid)
    })

    it('findOrCreateTagParentChain', async () => {
      const parent = createTag('parent')
      const child = createTag('child')

      await mutator.insertItems([parent, child])
      await mutator.setTagParent(parent, child)

      const a = await mutator.findOrCreateTagParentChain(['parent'])
      const b = await mutator.findOrCreateTagParentChain(['parent', 'child'])
      const c = await mutator.findOrCreateTagParentChain(['parent', 'child2'])
      const d = await mutator.findOrCreateTagParentChain(['parent2', 'child1'])

      expect(a?.uuid).toEqual(parent.uuid)
      expect(b?.uuid).toEqual(child.uuid)

      expect(c?.uuid).not.toEqual(parent.uuid)
      expect(c?.uuid).not.toEqual(child.uuid)
      expect(c?.parentId).toEqual(parent.uuid)

      expect(d?.uuid).not.toEqual(parent.uuid)
      expect(d?.uuid).not.toEqual(child.uuid)
      expect(d?.parentId).not.toEqual(parent.uuid)
    })

    it('isAncestor', async () => {
      const grandParent = createTag('grandParent')
      const parent = createTag('parent')
      const child = createTag('child')
      const another = createTag('another')

      await mutator.insertItems([child, parent, grandParent, another])
      await mutator.setTagParent(parent, child)
      await mutator.setTagParent(grandParent, parent)

      expect(itemManager.isTagAncestor(grandParent, parent)).toEqual(true)
      expect(itemManager.isTagAncestor(grandParent, child)).toEqual(true)
      expect(itemManager.isTagAncestor(parent, child)).toEqual(true)

      expect(itemManager.isTagAncestor(parent, grandParent)).toBeFalsy()
      expect(itemManager.isTagAncestor(child, grandParent)).toBeFalsy()
      expect(itemManager.isTagAncestor(grandParent, grandParent)).toBeFalsy()

      expect(itemManager.isTagAncestor(another, grandParent)).toBeFalsy()
      expect(itemManager.isTagAncestor(child, another)).toBeFalsy()
      expect(itemManager.isTagAncestor(grandParent, another)).toBeFalsy()
    })

    it('unsetTagRelationship', async () => {
      const parent = createTag('parent')
      const child = createTag('child')
      await mutator.insertItems([parent, child])
      await mutator.setTagParent(parent, child)
      expect(itemManager.getTagParent(child)?.uuid).toBe(parent.uuid)

      await mutator.unsetTagParent(child)

      expect(itemManager.getTagParent(child)).toBeUndefined()
    })

    it('getTagParentChain', async () => {
      const greatGrandParent = createTag('greatGrandParent')
      const grandParent = createTag('grandParent')
      const parent = createTag('parent')
      const child = createTag('child')
      await mutator.insertItems([greatGrandParent, grandParent, parent, child])
      await mutator.setTagParent(parent, child)
      await mutator.setTagParent(grandParent, parent)
      await mutator.setTagParent(greatGrandParent, grandParent)

      const uuidChain = itemManager.getTagParentChain(child).map((tag) => tag.uuid)

      expect(uuidChain).toHaveLength(3)
      expect(uuidChain).toEqual([greatGrandParent.uuid, grandParent.uuid, parent.uuid])
    })

    it('viewing notes for parent tag should not display notes of children', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      await mutator.insertItems([parentTag, childTag])
      await mutator.setTagParent(parentTag, childTag)

      const parentNote = createNoteWithTitle('parentNote')
      const childNote = createNoteWithTitle('childNote')
      await mutator.insertItems([parentNote, childNote])

      await mutator.addTagToNote(parentNote, parentTag, false)
      await mutator.addTagToNote(childNote, childTag, false)

      itemManager.setPrimaryItemDisplayOptions({
        tags: [parentTag],
        sortBy: 'title',
        sortDirection: 'asc',
      })

      const notes = itemManager.getDisplayableNotes()
      expect(notes).toHaveLength(1)
    })
  })

  describe('template items', () => {
    it('create template item', async () => {
      setupRandomUuid()

      const item = await itemManager.createTemplateItem(ContentType.TYPES.Note, {
        title: 'hello',
        references: [],
      })

      expect(!!item).toEqual(true)
      /* Template items should never be added to the record */
      expect(itemManager.items).toHaveLength(0)
      expect(itemManager.getDisplayableNotes()).toHaveLength(0)
    })

    it('isTemplateItem return the correct value', async () => {
      setupRandomUuid()

      const item = await itemManager.createTemplateItem(ContentType.TYPES.Note, {
        title: 'hello',
        references: [],
      })

      expect(itemManager.isTemplateItem(item)).toEqual(true)

      await mutator.insertItem(item)

      expect(itemManager.isTemplateItem(item)).toEqual(false)
    })

    it('isTemplateItem return the correct value for system smart views', () => {
      setupRandomUuid()

      const [systemTag1, ...restOfSystemViews] = itemManager
        .getSmartViews()
        .filter((view) => Object.values(Models.SystemViewId).includes(view.uuid as Models.SystemViewId))

      const isSystemTemplate = itemManager.isTemplateItem(systemTag1)
      expect(isSystemTemplate).toEqual(false)

      const areTemplates = restOfSystemViews.map((tag) => itemManager.isTemplateItem(tag)).every((value) => !!value)
      expect(areTemplates).toEqual(false)
    })
  })

  describe('tags', () => {
    it('lets me create a regular tag with a clear API', async () => {
      setupRandomUuid()

      const tag = await mutator.createTag({ title: 'this is my new tag' })

      expect(tag).toBeTruthy()
      expect(itemManager.isTemplateItem(tag)).toEqual(false)
    })

    it('should search tags correctly', async () => {
      setupRandomUuid()

      const foo = await mutator.createTag({ title: 'foo[' })
      const foobar = await mutator.createTag({ title: 'foo[bar]' })
      const bar = await mutator.createTag({ title: 'bar[' })
      const barfoo = await mutator.createTag({ title: 'bar[foo]' })
      const fooDelimiter = await mutator.createTag({ title: 'bar.foo' })
      const barFooDelimiter = await mutator.createTag({ title: 'baz.bar.foo' })
      const fooAttached = await mutator.createTag({ title: 'Foo' })
      const note = createNoteWithTitle('note')
      await mutator.insertItems([foo, foobar, bar, barfoo, fooDelimiter, barFooDelimiter, fooAttached, note])
      await mutator.addTagToNote(note, fooAttached, false)

      const fooResults = itemManager.searchTags('foo')
      expect(fooResults).toContainEqual(foo)
      expect(fooResults).toContainEqual(foobar)
      expect(fooResults).toContainEqual(barfoo)
      expect(fooResults).toContainEqual(fooDelimiter)
      expect(fooResults).toContainEqual(barFooDelimiter)
      expect(fooResults).not.toContainEqual(bar)
      expect(fooResults).not.toContainEqual(fooAttached)
    })
  })

  describe('tags notes index', () => {
    it('counts countable notes', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      await mutator.insertItems([parentTag, childTag])
      await mutator.setTagParent(parentTag, childTag)

      const parentNote = createNoteWithTitle('parentNote')
      const childNote = createNoteWithTitle('childNote')
      await mutator.insertItems([parentNote, childNote])

      await mutator.addTagToNote(parentNote, parentTag, false)
      await mutator.addTagToNote(childNote, childTag, false)

      expect(itemManager.countableNotesForTag(parentTag)).toBe(1)
      expect(itemManager.countableNotesForTag(childTag)).toBe(1)
      expect(itemManager.allCountableNotesCount()).toBe(2)
    })

    it('archiving a note should update count index', async () => {
      const tag1 = createTag('tag 1')
      await mutator.insertItems([tag1])

      const note1 = createNoteWithTitle('note 1')
      const note2 = createNoteWithTitle('note 2')
      await mutator.insertItems([note1, note2])

      await mutator.addTagToNote(note1, tag1, false)
      await mutator.addTagToNote(note2, tag1, false)

      expect(itemManager.countableNotesForTag(tag1)).toBe(2)
      expect(itemManager.allCountableNotesCount()).toBe(2)

      await mutator.changeItem<Models.NoteMutator>(note1, (m) => {
        m.archived = true
      })

      expect(itemManager.allCountableNotesCount()).toBe(1)
      expect(itemManager.countableNotesForTag(tag1)).toBe(1)

      await mutator.changeItem<Models.NoteMutator>(note1, (m) => {
        m.archived = false
      })

      expect(itemManager.allCountableNotesCount()).toBe(2)
      expect(itemManager.countableNotesForTag(tag1)).toBe(2)
    })
  })

  describe('smart views', () => {
    it('lets me create a smart view', async () => {
      setupRandomUuid()

      const [view1, view2, view3] = await Promise.all([
        mutator.createSmartView({ title: 'Not Pinned', predicate: NotPinnedPredicate }),
        mutator.createSmartView({ title: 'Last Day', predicate: LastDayPredicate }),
        mutator.createSmartView({ title: 'Long', predicate: LongTextPredicate }),
      ])

      expect(view1).toBeTruthy()
      expect(view2).toBeTruthy()
      expect(view3).toBeTruthy()

      expect(view1.content_type).toEqual(ContentType.TYPES.SmartView)
      expect(view2.content_type).toEqual(ContentType.TYPES.SmartView)
      expect(view3.content_type).toEqual(ContentType.TYPES.SmartView)
    })

    it('lets me use a smart view', async () => {
      setupRandomUuid()

      const view = await mutator.createSmartView({ title: 'Not Pinned', predicate: NotPinnedPredicate })

      const notes = itemManager.notesMatchingSmartView(view)

      expect(notes).toEqual([])
    })

    it('lets me test if a title is a smart view', () => {
      setupRandomUuid()

      expect(itemManager.isSmartViewTitle(VIEW_NOT_PINNED)).toEqual(true)
      expect(itemManager.isSmartViewTitle(VIEW_LAST_DAY)).toEqual(true)
      expect(itemManager.isSmartViewTitle(VIEW_LONG)).toEqual(true)

      expect(itemManager.isSmartViewTitle('Helloworld')).toEqual(false)
      expect(itemManager.isSmartViewTitle('@^![ some title')).toEqual(false)
    })

    it('lets me create a smart view from the DSL', async () => {
      setupRandomUuid()

      const [tag1, tag2, tag3] = await Promise.all([
        mutator.createSmartViewFromDSL(VIEW_NOT_PINNED),
        mutator.createSmartViewFromDSL(VIEW_LAST_DAY),
        mutator.createSmartViewFromDSL(VIEW_LONG),
      ])

      expect(tag1).toBeTruthy()
      expect(tag2).toBeTruthy()
      expect(tag3).toBeTruthy()

      expect(tag1.content_type).toEqual(ContentType.TYPES.SmartView)
      expect(tag2.content_type).toEqual(ContentType.TYPES.SmartView)
      expect(tag3.content_type).toEqual(ContentType.TYPES.SmartView)
    })

    it('will create smart view or tags from the generic method', async () => {
      setupRandomUuid()

      const someTag = await mutator.createTagOrSmartView('some-tag')
      const someView = await mutator.createTagOrSmartView(VIEW_LONG)

      expect(someTag.content_type).toEqual(ContentType.TYPES.Tag)
      expect(someView.content_type).toEqual(ContentType.TYPES.SmartView)
    })
  })

  it('lets me rename a smart view', async () => {
    setupRandomUuid()

    const tag = await mutator.createSmartView({ title: 'Not Pinned', predicate: NotPinnedPredicate })

    await mutator.changeItem<Models.TagMutator>(tag, (m) => {
      m.title = 'New Title'
    })

    const view = itemManager.findItem(tag.uuid) as Models.SmartView
    const views = itemManager.getSmartViews()

    expect(view.title).toEqual('New Title')
    expect(views.some((tag: Models.SmartView) => tag.title === 'New Title')).toEqual(true)
  })

  it('lets me find a smart view', async () => {
    setupRandomUuid()

    const tag = await mutator.createSmartView({ title: 'Not Pinned', predicate: NotPinnedPredicate })

    const view = itemManager.findItem(tag.uuid) as Models.SmartView

    expect(view).toBeDefined()
  })

  it('untagged notes smart view', async () => {
    setupRandomUuid()

    const view = itemManager.untaggedNotesSmartView

    const tag = createTag('tag')
    const untaggedNote = createNoteWithTitle('note')
    const taggedNote = createNoteWithTitle('taggedNote')
    await mutator.insertItems([tag, untaggedNote, taggedNote])

    expect(itemManager.notesMatchingSmartView(view)).toHaveLength(2)

    await mutator.addTagToNote(taggedNote, tag, false)

    expect(itemManager.notesMatchingSmartView(view)).toHaveLength(1)

    expect(view).toBeDefined()
  })

  describe('files', () => {
    it('should correctly rename file to filename that has extension', async () => {
      const file = createFile('initialName.ext')
      await mutator.insertItems([file])

      const renamedFile = await mutator.renameFile(file, 'anotherName.anotherExt')

      expect(renamedFile.name).toBe('anotherName.anotherExt')
    })

    it('should correctly rename extensionless file to filename that has extension', async () => {
      const file = createFile('initialName')
      await mutator.insertItems([file])

      const renamedFile = await mutator.renameFile(file, 'anotherName.anotherExt')

      expect(renamedFile.name).toBe('anotherName.anotherExt')
    })

    it('should correctly rename file to filename that does not have extension', async () => {
      const file = createFile('initialName.ext')
      await mutator.insertItems([file])

      const renamedFile = await mutator.renameFile(file, 'anotherName')

      expect(renamedFile.name).toBe('anotherName')
    })
  })

  describe('linking', () => {
    it('adding a note to a tag hierarchy should add the note to its parent too', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      const note = createNoteWithTitle('note')

      await mutator.insertItems([parentTag, childTag, note])
      await mutator.setTagParent(parentTag, childTag)

      await mutator.addTagToNote(note, childTag, true)

      const tags = itemManager.getSortedTagsForItem(note)

      expect(tags).toHaveLength(2)
      expect(tags[0].uuid).toEqual(childTag.uuid)
      expect(tags[1].uuid).toEqual(parentTag.uuid)
    })

    it('adding a note to a tag hierarchy should not add the note to its parent if hierarchy option is disabled', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      const note = createNoteWithTitle('note')

      await mutator.insertItems([parentTag, childTag, note])
      await mutator.setTagParent(parentTag, childTag)

      await mutator.addTagToNote(note, childTag, false)

      const tags = itemManager.getSortedTagsForItem(note)

      expect(tags).toHaveLength(1)
      expect(tags[0].uuid).toEqual(childTag.uuid)
    })

    it('adding a file to a tag hierarchy should add the file to its parent too', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      const file = createFile('file')

      await mutator.insertItems([parentTag, childTag, file])
      await mutator.setTagParent(parentTag, childTag)

      await mutator.addTagToFile(file, childTag, true)

      const tags = itemManager.getSortedTagsForItem(file)

      expect(tags).toHaveLength(2)
      expect(tags[0].uuid).toEqual(childTag.uuid)
      expect(tags[1].uuid).toEqual(parentTag.uuid)
    })

    it('adding a file to a tag hierarchy should not add the file to its parent if hierarchy option is disabled', async () => {
      const parentTag = createTag('parent')
      const childTag = createTag('child')
      const file = createFile('file')

      await mutator.insertItems([parentTag, childTag, file])
      await mutator.setTagParent(parentTag, childTag)

      await mutator.addTagToFile(file, childTag, false)

      const tags = itemManager.getSortedTagsForItem(file)

      expect(tags).toHaveLength(1)
      expect(tags[0].uuid).toEqual(childTag.uuid)
    })

    it('should link file with note', async () => {
      const note = createNoteWithTitle('invoices')
      const file = createFile('invoice_1.pdf')
      await mutator.insertItems([note, file])

      const resultingFile = await mutator.associateFileWithNote(file, note)
      assert(resultingFile)
      const references = resultingFile.references

      expect(references).toHaveLength(1)
      expect(references[0].uuid).toEqual(note.uuid)
    })

    it('should unlink file from note', async () => {
      const note = createNoteWithTitle('invoices')
      const file = createFile('invoice_1.pdf')
      await mutator.insertItems([note, file])

      const associatedFile = await mutator.associateFileWithNote(file, note)
      assert(associatedFile)
      const disassociatedFile = await mutator.disassociateFileWithNote(associatedFile, note)
      const references = disassociatedFile.references

      expect(references).toHaveLength(0)
    })

    it('should link note to note', async () => {
      const note = createNoteWithTitle('research')
      const note2 = createNoteWithTitle('citation')
      await mutator.insertItems([note, note2])

      const resultingNote = await mutator.linkNoteToNote(note, note2)
      const references = resultingNote.references

      expect(references).toHaveLength(1)
      expect(references[0].uuid).toEqual(note2.uuid)
    })

    it('should link file to file', async () => {
      const file = createFile('research')
      const file2 = createFile('citation')
      await mutator.insertItems([file, file2])

      const resultingfile = await mutator.linkFileToFile(file, file2)
      const references = resultingfile.references

      expect(references).toHaveLength(1)
      expect(references[0].uuid).toEqual(file2.uuid)
    })

    it('should get the relationship type for two items', async () => {
      const firstNote = createNoteWithTitle('First note')
      const secondNote = createNoteWithTitle('Second note')
      const unlinkedNote = createNoteWithTitle('Unlinked note')
      await mutator.insertItems([firstNote, secondNote, unlinkedNote])

      const firstNoteLinkedToSecond = await mutator.linkNoteToNote(firstNote, secondNote)

      const relationshipOfFirstNoteToSecond = itemManager.relationshipDirectionBetweenItems(
        firstNoteLinkedToSecond,
        secondNote,
      )
      const relationshipOfSecondNoteToFirst = itemManager.relationshipDirectionBetweenItems(
        secondNote,
        firstNoteLinkedToSecond,
      )
      const relationshipOfFirstNoteToUnlinked = itemManager.relationshipDirectionBetweenItems(
        firstNoteLinkedToSecond,
        unlinkedNote,
      )

      expect(relationshipOfFirstNoteToSecond).toBe(ItemRelationshipDirection.AReferencesB)
      expect(relationshipOfSecondNoteToFirst).toBe(ItemRelationshipDirection.BReferencesA)
      expect(relationshipOfFirstNoteToUnlinked).toBe(ItemRelationshipDirection.NoRelationship)
    })

    it('should unlink itemOne from itemTwo if relation is direct', async () => {
      const note = createNoteWithTitle('Note 1')
      const note2 = createNoteWithTitle('Note 2')
      await mutator.insertItems([note, note2])

      const linkedItem = await mutator.linkNoteToNote(note, note2)
      const unlinkedItem = await mutator.unlinkItems(linkedItem, note2)
      const references = unlinkedItem.references

      expect(unlinkedItem.uuid).toBe(note.uuid)
      expect(references).toHaveLength(0)
    })

    it('should unlink itemTwo from itemOne if relation is indirect', async () => {
      const note = createNoteWithTitle('Note 1')
      const note2 = createNoteWithTitle('Note 2')
      await mutator.insertItems([note, note2])

      const linkedItem = await mutator.linkNoteToNote(note, note2)
      const changedItem = await mutator.unlinkItems(linkedItem, note2)

      expect(changedItem.uuid).toBe(note.uuid)
      expect(changedItem.references).toHaveLength(0)
    })
  })
})
