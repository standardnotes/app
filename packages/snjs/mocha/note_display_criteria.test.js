chai.use(chaiAsPromised)
const expect = chai.expect

describe('note display criteria', function () {
  let payloadManager
  let itemManager
  let mutator

  let createNote
  let createTag

  beforeEach(async function () {
    const logger = new Logger('test')

    payloadManager = new PayloadManager(logger)
    itemManager = new ItemManager(payloadManager)
    mutator = new MutatorService(itemManager, payloadManager)

    createNote = async (title = 'hello', text = 'world') => {
      return mutator.createItem(ContentType.TYPES.Note, {
        title: title,
        text: text,
      })
    }

    createTag = async (notes = [], title = 'thoughts') => {
      const references = notes.map((note) => {
        return {
          uuid: note.uuid,
          content_type: note.content_type,
        }
      })
      return mutator.createItem(ContentType.TYPES.Tag, {
        title: title,
        references: references,
      })
    }
  })

  it('includePinned off', async function () {
    await createNote()
    const pendingPin = await createNote()
    await mutator.changeItem(pendingPin, (mutator) => {
      mutator.pinned = true
    })
    const criteria = {
      includePinned: false,
    }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includePinned on', async function () {
    await createNote()
    const pendingPin = await createNote()
    await mutator.changeItem(pendingPin, (mutator) => {
      mutator.pinned = true
    })
    const criteria = { includePinned: true }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeTrashed off', async function () {
    await createNote()
    const pendingTrash = await createNote()
    await mutator.changeItem(pendingTrash, (mutator) => {
      mutator.trashed = true
    })
    const criteria = { includeTrashed: false }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeTrashed on', async function () {
    await createNote()
    const pendingTrash = await createNote()
    await mutator.changeItem(pendingTrash, (mutator) => {
      mutator.trashed = true
    })
    const criteria = { includeTrashed: true }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeArchived off', async function () {
    await createNote()
    const pendingArchive = await createNote()
    await mutator.changeItem(pendingArchive, (mutator) => {
      mutator.archived = true
    })
    const criteria = { includeArchived: false }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeArchived on', async function () {
    await createNote()
    const pendingArchive = await createNote()
    await mutator.changeItem(pendingArchive, (mutator) => {
      mutator.archived = true
    })
    const criteria = {
      includeArchived: true,
    }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeProtected off', async function () {
    await createNote()
    const pendingProtected = await createNote()
    await mutator.changeItem(pendingProtected, (mutator) => {
      mutator.protected = true
    })
    const criteria = { includeProtected: false }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeProtected on', async function () {
    await createNote()
    const pendingProtected = await createNote()
    await mutator.changeItem(pendingProtected, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      includeProtected: true,
    }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('protectedSearchEnabled false', async function () {
    const normal = await createNote('hello', 'world')
    await mutator.changeItem(normal, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      searchQuery: { query: 'world', includeProtectedNoteText: false },
    }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(0)
  })

  it('protectedSearchEnabled true', async function () {
    const normal = await createNote()
    await mutator.changeItem(normal, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      searchQuery: { query: 'world', includeProtectedNoteText: true },
    }
    expect(
      notesAndFilesMatchingOptions(criteria, itemManager.collection.all(ContentType.TYPES.Note), itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('tags', async function () {
    const note = await createNote()
    const tag = await createTag([note])
    const looseTag = await createTag([], 'loose')

    const matchingCriteria = {
      tags: [tag],
    }
    expect(
      notesAndFilesMatchingOptions(
        matchingCriteria,
        itemManager.collection.all(ContentType.TYPES.Note),
        itemManager.collection,
      ).length,
    ).to.equal(1)

    const nonmatchingCriteria = {
      tags: [looseTag],
    }
    expect(
      notesAndFilesMatchingOptions(
        nonmatchingCriteria,
        itemManager.collection.all(ContentType.TYPES.Note),
        itemManager.collection,
      ).length,
    ).to.equal(0)
  })

  describe('smart views', function () {
    it('normal note', async function () {
      await createNote()
      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('trashed note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeTrashed: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = false
        mutator.archived = true
      })
      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe('includeTrash', function () {
    it('normal note', async function () {
      await createNote()

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeTrashed: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeTrashed: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('trashed note', async function () {
      const normal = await createNote()

      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeTrashed: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeTrashed: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeTrashed: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
            includeTrashed: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived + trashed note', async function () {
      const normal = await createNote()

      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe('includeArchived', function () {
    it('normal note', async function () {
      await createNote()

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
            includeArchived: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe.skip('multiple tags', function () {
    it('normal note', async function () {
      await createNote()
      /**
       * This test presently fails because the compound predicate created
       * when using multiple views is an AND predicate instead of OR
       */
      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView, itemManager.archivedSmartView, itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
            includeArchived: false,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await createNote()
      await mutator.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.allNotesSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.trashSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        notesAndFilesMatchingOptions(
          {
            views: [itemManager.archivedSmartView],
            includeArchived: true,
          },
          itemManager.collection.all(ContentType.TYPES.Note),
          itemManager.collection,
        ).length,
      ).to.equal(0)
    })
  })
})
