/* eslint-disable no-undef */
chai.use(chaiAsPromised)
const expect = chai.expect

describe('note display criteria', function () {
  beforeEach(async function () {
    this.payloadManager = new PayloadManager()
    this.itemManager = new ItemManager(this.payloadManager)

    this.createNote = async (title = 'hello', text = 'world') => {
      return this.itemManager.createItem(ContentType.Note, {
        title: title,
        text: text,
      })
    }

    this.createTag = async (notes = [], title = 'thoughts') => {
      const references = notes.map((note) => {
        return {
          uuid: note.uuid,
          content_type: note.content_type,
        }
      })
      return this.itemManager.createItem(ContentType.Tag, {
        title: title,
        references: references,
      })
    }
  })

  it('includePinned off', async function () {
    await this.createNote()
    const pendingPin = await this.createNote()
    await this.itemManager.changeItem(pendingPin, (mutator) => {
      mutator.pinned = true
    })
    const criteria = {
      includePinned: false,
    }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includePinned on', async function () {
    await this.createNote()
    const pendingPin = await this.createNote()
    await this.itemManager.changeItem(pendingPin, (mutator) => {
      mutator.pinned = true
    })
    const criteria = { includePinned: true }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeTrashed off', async function () {
    await this.createNote()
    const pendingTrash = await this.createNote()
    await this.itemManager.changeItem(pendingTrash, (mutator) => {
      mutator.trashed = true
    })
    const criteria = { includeTrashed: false }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeTrashed on', async function () {
    await this.createNote()
    const pendingTrash = await this.createNote()
    await this.itemManager.changeItem(pendingTrash, (mutator) => {
      mutator.trashed = true
    })
    const criteria = { includeTrashed: true }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeArchived off', async function () {
    await this.createNote()
    const pendingArchive = await this.createNote()
    await this.itemManager.changeItem(pendingArchive, (mutator) => {
      mutator.archived = true
    })
    const criteria = { includeArchived: false }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeArchived on', async function () {
    await this.createNote()
    const pendingArchive = await this.createNote()
    await this.itemManager.changeItem(pendingArchive, (mutator) => {
      mutator.archived = true
    })
    const criteria = {
      includeArchived: true,
    }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('includeProtected off', async function () {
    await this.createNote()
    const pendingProtected = await this.createNote()
    await this.itemManager.changeItem(pendingProtected, (mutator) => {
      mutator.protected = true
    })
    const criteria = { includeProtected: false }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('includeProtected on', async function () {
    await this.createNote()
    const pendingProtected = await this.createNote()
    await this.itemManager.changeItem(pendingProtected, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      includeProtected: true,
    }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(2)
  })

  it('protectedSearchEnabled false', async function () {
    const normal = await this.createNote('hello', 'world')
    await this.itemManager.changeItem(normal, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      searchQuery: { query: 'world', includeProtectedNoteText: false },
    }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(0)
  })

  it('protectedSearchEnabled true', async function () {
    const normal = await this.createNote()
    await this.itemManager.changeItem(normal, (mutator) => {
      mutator.protected = true
    })
    const criteria = {
      searchQuery: { query: 'world', includeProtectedNoteText: true },
    }
    expect(
      itemsMatchingOptions(criteria, this.itemManager.collection.all(ContentType.Note), this.itemManager.collection)
        .length,
    ).to.equal(1)
  })

  it('tags', async function () {
    const note = await this.createNote()
    const tag = await this.createTag([note])
    const looseTag = await this.createTag([], 'loose')

    const matchingCriteria = {
      tags: [tag],
    }
    expect(
      itemsMatchingOptions(
        matchingCriteria,
        this.itemManager.collection.all(ContentType.Note),
        this.itemManager.collection,
      ).length,
    ).to.equal(1)

    const nonmatchingCriteria = {
      tags: [looseTag],
    }
    expect(
      itemsMatchingOptions(
        nonmatchingCriteria,
        this.itemManager.collection.all(ContentType.Note),
        this.itemManager.collection,
      ).length,
    ).to.equal(0)
  })

  describe('smart views', function () {
    it('normal note', async function () {
      await this.createNote()
      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('trashed note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeTrashed: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = false
        mutator.archived = true
      })
      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe('includeTrash', function () {
    it('normal note', async function () {
      await this.createNote()

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeTrashed: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeTrashed: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('trashed note', async function () {
      const normal = await this.createNote()

      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeTrashed: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeTrashed: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeTrashed: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
            includeTrashed: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived + trashed note', async function () {
      const normal = await this.createNote()

      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe('includeArchived', function () {
    it('normal note', async function () {
      await this.createNote()

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
            includeArchived: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })
  })

  describe.skip('multiple tags', function () {
    it('normal note', async function () {
      await this.createNote()

      expect(
        itemsMatchingOptions(
          {
            views: [
              this.itemManager.allNotesSmartView,
              this.itemManager.archivedSmartView,
              this.itemManager.trashSmartView,
            ],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })

    it('archived note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
            includeArchived: false,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)
    })

    it('archived + trashed note', async function () {
      const normal = await this.createNote()
      await this.itemManager.changeItem(normal, (mutator) => {
        mutator.trashed = true
        mutator.archived = true
      })

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.allNotesSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.trashSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(1)

      expect(
        itemsMatchingOptions(
          {
            views: [this.itemManager.archivedSmartView],
            includeArchived: true,
          },
          this.itemManager.collection.all(ContentType.Note),
          this.itemManager.collection,
        ).length,
      ).to.equal(0)
    })
  })
})
