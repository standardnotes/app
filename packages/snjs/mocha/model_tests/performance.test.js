import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('mapping performance', () => {
  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(async function () {
    localStorage.clear()
  })

  it('shouldnt take a long time', async () => {
    /*
    There was an issue with mapping where we were using arrays for everything instead of hashes (like items, missedReferences),
    which caused searching to be really expensive and caused a huge slowdown.
    */
    const application = await Factory.createInitAppWithFakeCrypto()

    // create a bunch of notes and tags, and make sure mapping doesn't take a long time
    const noteCount = 1500
    const tagCount = 10
    const tags = []
    const notes = []
    for (let i = 0; i < tagCount; i++) {
      var tag = {
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.TYPES.Tag,
        content: {
          title: `${Math.random()}`,
          references: [],
        },
      }
      tags.push(tag)
    }
    for (let i = 0; i < noteCount; i++) {
      const note = {
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: `${Math.random()}`,
          text: `${Math.random()}`,
          references: [],
        },
      }
      const randomTag = Factory.randomArrayValue(tags)
      randomTag.content.references.push({
        content_type: ContentType.TYPES.Note,
        uuid: note.uuid,
      })
      notes.push(note)
    }

    const payloads = Factory.shuffleArray(tags.concat(notes)).map((item) => {
      return new DecryptedPayload(item)
    })

    const t0 = performance.now()
    // process items in separate batches, so as to trigger missed references
    let currentIndex = 0
    const batchSize = 100
    for (let i = 0; i < payloads.length; i += batchSize) {
      const subArray = payloads.slice(currentIndex, currentIndex + batchSize)
      await application.mutator.emitItemsFromPayloads(subArray, PayloadEmitSource.LocalChanged)
      currentIndex += batchSize
    }

    const t1 = performance.now()
    const seconds = (t1 - t0) / 1000
    const expectedRunTime = 3 // seconds
    expect(seconds).to.be.at.most(expectedRunTime)

    for (const note of application.items.getItems(ContentType.TYPES.Note)) {
      expect(application.items.itemsReferencingItem(note).length).to.be.above(0)
    }
    await Factory.safeDeinit(application)
  }).timeout(20000)

  it('mapping a tag with thousands of notes should be quick', async () => {
    /*
      There was an issue where if you have a tag with thousands of notes, it will take minutes to resolve.
      Fixed now. The issue was that we were looping around too much. I've consolidated some of the loops
      so that things require less loops in payloadManager, regarding missedReferences.
    */
    const application = await Factory.createInitAppWithFakeCrypto()

    const noteCount = 10000
    const notes = []

    const tag = {
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.Tag,
      content: {
        title: `${Math.random()}`,
        references: [],
      },
    }

    for (let i = 0; i < noteCount; i++) {
      const note = {
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: `${Math.random()}`,
          text: `${Math.random()}`,
          references: [],
        },
      }

      tag.content.references.push({
        content_type: ContentType.TYPES.Note,
        uuid: note.uuid,
      })
      notes.push(note)
    }

    const payloads = [tag].concat(notes).map((item) => new DecryptedPayload(item))

    const t0 = performance.now()
    // process items in separate batches, so as to trigger missed references
    let currentIndex = 0
    const batchSize = 100
    for (let i = 0; i < payloads.length; i += batchSize) {
      var subArray = payloads.slice(currentIndex, currentIndex + batchSize)
      await application.mutator.emitItemsFromPayloads(subArray, PayloadEmitSource.LocalChanged)
      currentIndex += batchSize
    }

    const t1 = performance.now()
    const seconds = (t1 - t0) / 1000
    /** Expected run time depends on many different factors,
     * like how many other tests you're running and overall system capacity.
     * Locally, best case should be around 3.3s and worst case should be 5s.
     * However on CI this can sometimes take up to 10s.
     */
    const MAX_RUN_TIME = 15.0 // seconds
    expect(seconds).to.be.at.most(MAX_RUN_TIME)

    application.items.getItems(ContentType.TYPES.Tag)[0]
    for (const note of application.items.getItems(ContentType.TYPES.Note)) {
      expect(application.items.itemsReferencingItem(note).length).to.equal(1)
    }
    await Factory.safeDeinit(application)
  }).timeout(20000)
})
