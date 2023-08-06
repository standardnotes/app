import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('offline syncing', () => {
  let context
  let application
  let expectedItemCount

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItems
    context = await Factory.createAppContext()
    await context.launch()
    application = context.application
  })

  afterEach(async function () {
    expect(application.sync.isOutOfSync()).to.equal(false)
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
    context = undefined
  })

  it('uuid alternation should delete original payload', async function () {
    const note = await Factory.createMappedNote(application)
    expectedItemCount++

    await Factory.alternateUuidForItem(application, note.uuid)
    await application.sync.sync(syncOptions)

    const notes = application.items.getDisplayableNotes()
    expect(notes.length).to.equal(1)
    expect(notes[0].uuid).to.not.equal(note.uuid)

    const items = application.items.allTrackedItems()
    expect(items.length).to.equal(expectedItemCount)
  })

  it('should sync item with no passcode', async function () {
    let note = await Factory.createMappedNote(application)
    expect(Uuids(application.items.getDirtyItems()).includes(note.uuid))

    await application.sync.sync(syncOptions)

    note = application.items.findItem(note.uuid)

    /** In rare cases a sync can complete so fast that the dates are equal; this is ok. */
    expect(note.lastSyncEnd).to.be.at.least(note.lastSyncBegan)

    expectedItemCount++

    expect(application.items.getDirtyItems().length).to.equal(0)

    const rawPayloads2 = await application.storage.getAllRawPayloads()
    expect(rawPayloads2.length).to.equal(expectedItemCount)

    const itemsKeyRaw = (await Factory.getStoragePayloadsOfType(application, ContentType.TYPES.ItemsKey))[0]
    const noteRaw = (await Factory.getStoragePayloadsOfType(application, ContentType.TYPES.Note))[0]

    /** Encrypts with default items key */
    expect(typeof noteRaw.content).to.equal('string')

    /** Not encrypted as no passcode/root key */
    expect(typeof itemsKeyRaw.content).to.equal('object')
  })

  it('should sync item encrypted with passcode', async function () {
    await application.addPasscode('foobar')
    await Factory.createMappedNote(application)
    expect(application.items.getDirtyItems().length).to.equal(1)
    const rawPayloads1 = await application.storage.getAllRawPayloads()
    expect(rawPayloads1.length).to.equal(expectedItemCount)

    await application.sync.sync(syncOptions)
    expectedItemCount++

    expect(application.items.getDirtyItems().length).to.equal(0)
    const rawPayloads2 = await application.storage.getAllRawPayloads()
    expect(rawPayloads2.length).to.equal(expectedItemCount)

    const payload = rawPayloads2[0]
    expect(typeof payload.content).to.equal('string')
    expect(payload.content.startsWith(application.encryption.getLatestVersion())).to.equal(true)
  })

  it('signing out while offline should succeed', async function () {
    await Factory.createMappedNote(application)
    expectedItemCount++
    await application.sync.sync(syncOptions)
    application = await Factory.signOutApplicationAndReturnNew(application)
    expect(application.sessions.isSignedIn()).to.equal(false)
    expect(application.sessions.getUser()).to.not.be.ok
  })
})
