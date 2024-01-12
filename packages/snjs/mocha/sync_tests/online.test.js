import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'
import * as Utils from '../lib/Utils.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('online syncing', function () {
  this.timeout(Factory.TenSecondTimeout)

  let application
  let email
  let password
  let expectedItemCount
  let context
  let safeGuard

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItemsWithAccount

    context = await Factory.createAppContext()
    await context.launch()

    application = context.application
    email = context.email
    password = context.password

    Factory.disableIntegrityAutoHeal(application)

    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    safeGuard = application.dependencies.get(TYPES.SyncFrequencyGuard)

    safeGuard.clear()
  })

  afterEach(async function () {
    expect(application.sync.isOutOfSync()).to.equal(false)

    const items = application.items.allTrackedItems()
    expect(items.length).to.equal(expectedItemCount)

    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
    await Factory.safeDeinit(application)
    localStorage.clear()

    safeGuard.clear()

    application = undefined
    context = undefined
    safeGuard = undefined
  })

  function noteObjectsFromObjects(items) {
    return items.filter((item) => item.content_type === ContentType.TYPES.Note)
  }

  it('should register and sync basic model online', async function () {
    let note = await Factory.createSyncedNote(application)
    expectedItemCount++
    expect(application.items.getDirtyItems().length).to.equal(0)
    note = application.items.findItem(note.uuid)
    expect(note.dirty).to.not.be.ok

    const rawPayloads = await application.storage.getAllRawPayloads()
    const notePayloads = noteObjectsFromObjects(rawPayloads)
    expect(notePayloads.length).to.equal(1)
    for (const rawNote of notePayloads) {
      expect(rawNote.dirty).to.not.be.ok
    }
  })

  it('should login and retrieve synced item', async function () {
    const note = await Factory.createSyncedNote(application)
    expectedItemCount++
    application = await Factory.signOutApplicationAndReturnNew(application)

    await Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
    })

    const notes = application.items.getDisplayableNotes()
    expect(notes.length).to.equal(1)
    expect(notes[0].title).to.equal(note.title)
  })

  it('can complete multipage sync on sign in', async function () {
    const count = 0

    await Factory.createManyMappedNotes(application, count)

    expectedItemCount += count

    await application.sync.sync(syncOptions)

    application = await context.signout()

    expect(application.items.items.length).to.equal(BaseItemCounts.DefaultItems)

    const promise = Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
    })

    /** Throw in some random syncs to cause trouble */
    const syncCount = 30

    for (let i = 0; i < syncCount; i++) {
      application.sync.sync(syncOptions)
      await Factory.sleep(0.01, undefined, true)
    }
    await promise
    expect(promise).to.be.fulfilled

    /** Allow any unwaited syncs in for loop to complete */
    await Factory.sleep(0.5)
  }).timeout(20000)

  it('having offline data then signing in should not alternate uuid and merge with account', async function () {
    application = await Factory.signOutApplicationAndReturnNew(application)
    const note = await Factory.createMappedNote(application)
    expectedItemCount++
    await Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
      mergeLocal: true,
    })

    const notes = application.items.getDisplayableNotes()
    expect(notes.length).to.equal(1)
    /** uuid should have been alternated */
    expect(notes[0].uuid).to.equal(note.uuid)
  })

  it('resolve on next timing strategy', async function () {
    const syncCount = 7
    let successes = 0
    let events = 0

    application.sync.ut_beginLatencySimulator(250)
    application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded) {
        events++
      }
    })

    const promises = []
    for (let i = 0; i < syncCount; i++) {
      promises.push(
        application.sync
          .sync({
            queueStrategy: SyncQueueStrategy.ResolveOnNext,
          })
          .then(() => {
            successes++
          }),
      )
    }

    await Promise.all(promises)
    expect(successes).to.equal(syncCount)
    // Only a fully executed sync request creates a sync:completed event.
    // We don't know how many will execute above.
    expect(events).to.be.at.least(1)

    application.sync.ut_endLatencySimulator()
    // Since the syncs all happen after one another, extra syncs may be queued on that we are not awaiting.
    await Factory.sleep(0.5)
  })

  it('force spawn new timing strategy', async function () {
    const syncCount = 7
    let successes = 0
    let events = 0

    application.sync.ut_beginLatencySimulator(250)

    application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded) {
        events++
      }
    })

    const promises = []
    for (let i = 0; i < syncCount; i++) {
      promises.push(
        application.sync
          .sync({
            queueStrategy: SyncQueueStrategy.ForceSpawnNew,
          })
          .then(() => {
            successes++
          }),
      )
    }
    await Promise.all(promises)
    expect(successes).to.equal(syncCount)
    expect(events).to.equal(syncCount)
    application.sync.ut_endLatencySimulator()
  })

  it('retrieving new items should not mark them as dirty', async function () {
    const originalNote = await Factory.createSyncedNote(application)
    expectedItemCount++

    application = await Factory.signOutApplicationAndReturnNew(application)
    const promise = new Promise((resolve) => {
      application.sync.addEventObserver(async (event) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const note = application.items.findItem(originalNote.uuid)
          if (note) {
            expect(note.dirty).to.not.be.ok
            resolve()
          }
        }
      })
    })
    await application.signIn(email, password, undefined, undefined, undefined, true)
    await promise
  })

  it('allows saving of data after sign out', async function () {
    expect(application.items.getDisplayableItemsKeys().length).to.equal(1)
    application = await Factory.signOutApplicationAndReturnNew(application)
    expect(application.items.getDisplayableItemsKeys().length).to.equal(1)
    const note = await Factory.createMappedNote(application)
    expectedItemCount++
    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)
    const rawPayloads = await application.storage.getAllRawPayloads()
    const notePayload = noteObjectsFromObjects(rawPayloads)
    expect(notePayload.length).to.equal(1)
    expect(application.items.getDisplayableNotes().length).to.equal(1)

    // set item to be merged for when sign in occurs
    await application.sync.markAllItemsAsNeedingSyncAndPersist()
    expect(application.sync.isOutOfSync()).to.equal(false)
    expect(application.items.getDirtyItems().length).to.equal(BaseItemCounts.DefaultItems + 1)

    // Sign back in for next tests
    await Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
    })

    expect(application.items.getDirtyItems().length).to.equal(0)
    expect(application.items.getDisplayableItemsKeys().length).to.equal(1)
    expect(application.sync.isOutOfSync()).to.equal(false)
    expect(application.items.getDisplayableNotes().length).to.equal(1)

    for (const item of application.items.getDisplayableNotes()) {
      expect(item.content.title).to.be.ok
    }

    const updatedRawPayloads = await application.storage.getAllRawPayloads()
    for (const payload of updatedRawPayloads) {
      // if an item comes back from the server, it is saved to disk immediately without a dirty value.
      expect(payload.dirty).to.not.be.ok
    }
  })

  it('mapping should not mutate items with error decrypting state', async function () {
    const note = await Factory.createMappedNote(application)

    expectedItemCount++

    const originalTitle = note.content.title

    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)

    const encrypted = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [note.payloadRepresentation()],
        },
      }),
    )

    const errorred = new EncryptedPayload({
      ...encrypted,
      errorDecrypting: true,
    })

    const items = await application.mutator.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const mappedItem = application.items.findAnyItem(errorred.uuid)

    expect(typeof mappedItem.content).to.equal('string')

    const decryptedPayload = await application.encryption.decryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [errorred],
      },
    })

    const mappedItems2 = await application.mutator.emitItemsFromPayloads(
      [decryptedPayload],
      PayloadEmitSource.LocalChanged,
    )

    const mappedItem2 = mappedItems2[0]
    expect(typeof mappedItem2.content).to.equal('object')
    expect(mappedItem2.content.title).to.equal(originalTitle)
  })

  it('signing into account with pre-existing items', async function () {
    const note = await Factory.createMappedNote(application)
    await Factory.markDirtyAndSyncItem(application, note)
    expectedItemCount += 1

    application = await Factory.signOutApplicationAndReturnNew(application)
    await application.signIn(email, password, undefined, undefined, undefined, true)

    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('removes item from storage upon deletion', async function () {
    let note = await Factory.createMappedNote(application)
    expectedItemCount++

    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)

    note = application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(application.items.items.length).to.equal(expectedItemCount)

    await application.mutator.setItemToBeDeleted(note)
    note = application.items.findAnyItem(note.uuid)
    expect(note.dirty).to.equal(true)
    expectedItemCount--

    await application.sync.sync(syncOptions)
    note = application.items.findItem(note.uuid)
    expect(note).to.not.be.ok

    // We expect that this item is now gone for good, and no duplicate has been created.
    expect(application.items.items.length).to.equal(expectedItemCount)
    await Factory.sleep(0.5)
    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
  })

  it('retrieving item with no content should correctly map local state', async function () {
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)

    const syncToken = await application.sync.getLastSyncToken()

    expectedItemCount++
    expect(application.items.items.length).to.equal(expectedItemCount)

    // client A
    await application.mutator.setItemToBeDeleted(note)
    await application.sync.sync(syncOptions)

    // Subtract 1
    expectedItemCount--

    // client B
    // Clearing sync tokens wont work as server wont return deleted items.
    // Set saved sync token instead
    await application.sync.setLastSyncToken(syncToken)
    await application.sync.sync(syncOptions)

    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('changing an item while it is being synced should sync again', async function () {
    const note = await Factory.createMappedNote(application)

    expectedItemCount++

    /** Begin syncing it with server but introduce latency so we can sneak in a delete */
    application.sync.ut_beginLatencySimulator(500)

    const sync = application.sync.sync()

    /** Sleep so sync call can begin preparations but not fully begin */

    await Factory.sleep(0.1)

    await application.mutator.changeItem(note, (mutator) => {
      mutator.title = 'latest title'
    })

    await sync

    application.sync.ut_endLatencySimulator()

    await application.sync.sync(syncOptions)

    const latestNote = application.items.findItem(note.uuid)
    expect(latestNote.title).to.equal('latest title')
  })

  it('deleting an item while it is being synced should keep deletion state', async function () {
    const note = await Factory.createMappedNote(application)

    expectedItemCount++

    /** Begin syncing it with server but introduce latency so we can sneak in a delete */
    application.sync.ut_beginLatencySimulator(500)

    const sync = application.sync.sync()

    /** Sleep so sync call can begin preparations but not fully begin */

    await Factory.sleep(0.1)

    await application.mutator.setItemToBeDeleted(note)

    expectedItemCount--

    await sync

    application.sync.ut_endLatencySimulator()

    await application.sync.sync(syncOptions)

    /** We expect that item has been deleted */
    const allItems = application.items.items
    expect(allItems.length).to.equal(expectedItemCount)
  })

  it('should defer syncing if syncing is breaching the sync calls per minute threshold', async function () {
    let syncCount = 0
    while(!safeGuard.isSyncCallsThresholdReachedThisMinute()) {
      await application.sync.sync({
        onPresyncSave: () => {
          syncCount++
        }
      })
    }

    expect(safeGuard.isSyncCallsThresholdReachedThisMinute()).to.equal(true)
    expect(syncCount).to.equal(200)
  })

  it('items that are never synced and deleted should not be uploaded to server', async function () {
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    await application.mutator.setItemToBeDeleted(note)

    let success = true
    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    application.sync.addEventObserver((eventName, data) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        beginCheckingResponse = true
      }
      if (!beginCheckingResponse) {
        return
      }
      if (!didCompleteRelevantSync && eventName === SyncEvent.PaginatedSyncRequestCompleted) {
        didCompleteRelevantSync = true
        const response = data
        const matching = response.savedPayloads.find((p) => p.uuid === note.uuid)
        if (matching) {
          success = false
        }
      }
    })
    await application.sync.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
    expect(success).to.equal(true)
  })

  it('items that are deleted after download first sync complete should not be uploaded to server', async function () {
    /** The singleton manager may delete items are download first. We dont want those uploaded to server. */
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)

    let success = true
    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    application.sync.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        await application.mutator.setItemToBeDeleted(note)
        beginCheckingResponse = true
      }
      if (!beginCheckingResponse) {
        return
      }
      if (!didCompleteRelevantSync && eventName === SyncEvent.PaginatedSyncRequestCompleted) {
        didCompleteRelevantSync = true
        const response = data
        const matching = response.savedPayloads.find((p) => p.uuid === note.uuid)
        if (matching) {
          success = false
        }
      }
    })
    await application.sync.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
    expect(success).to.equal(true)
  })

  it('marking an item dirty then saving to disk should retain that dirty state when restored', async function () {
    const note = await Factory.createMappedNote(application)

    expectedItemCount++

    await application.sync.markAllItemsAsNeedingSyncAndPersist()

    application.items.resetState()
    application.payloads.resetState()

    await application.sync.clearSyncPositionTokens()

    expect(application.items.items.length).to.equal(0)

    const rawPayloads = await application.storage.getAllRawPayloads()

    const encryptedPayloads = rawPayloads.map((rawPayload) => {
      return new EncryptedPayload(rawPayload)
    })

    const encryptionSplit = SplitPayloadsByEncryptionType(encryptedPayloads)

    const keyedSplit = CreateDecryptionSplitWithKeyLookup(encryptionSplit)

    const decryptionResults = await application.encryption.decryptSplit(keyedSplit)

    await application.mutator.emitItemsFromPayloads(decryptionResults, PayloadEmitSource.LocalChanged)

    expect(application.items.allTrackedItems().length).to.equal(expectedItemCount)

    const foundNote = application.items.findAnyItem(note.uuid)

    expect(foundNote.dirty).to.equal(true)

    await application.sync.sync(syncOptions)
  })

  /** This test takes 30s+ on a Docker server environment and should be skipped for now */
  it.skip('should handle uploading with sync pagination', async function () {
    const largeItemCount = SyncUpDownLimit + 10
    for (let i = 0; i < largeItemCount; i++) {
      const note = await Factory.createMappedNote(application)
      await application.mutator.setItemDirty(note)
    }

    expectedItemCount += largeItemCount

    await application.sync.sync(syncOptions)
    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
  }).timeout(Factory.SixtySecondTimeout)

  /** This test takes 30s+ on a Docker server environment and should be skipped for now */
  it.skip('should handle downloading with sync pagination', async function () {
    const largeItemCount = SyncUpDownLimit + 10
    for (let i = 0; i < largeItemCount; i++) {
      const note = await Factory.createMappedNote(application)
      await application.mutator.setItemDirty(note)
    }
    /** Upload */
    application.sync.sync({ awaitAll: true, checkIntegrity: false })
    await context.awaitNextSucessfulSync()
    expectedItemCount += largeItemCount

    /** Clear local data */
    await application.payloads.resetState()
    await application.items.resetState()
    await application.sync.clearSyncPositionTokens()
    await application.storage.clearAllPayloads()
    expect(application.items.items.length).to.equal(0)

    /** Download all data */
    application.sync.sync(syncOptions)
    await context.awaitNextSucessfulSync()
    expect(application.items.items.length).to.equal(expectedItemCount)

    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
  }).timeout(Factory.SixtySecondTimeout)

  it('should sync all items including ones that are breaching transfer limit', async function () {
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())
    const numberOfNotesToExceedThe1MBTransferLimit = Math.ceil(100_000 / buffer.length) + 1

    const testContext = await Factory.createAppContextWithFakeCrypto()
    await testContext.launch()
    await testContext.register()
    const email = testContext.email
    const password = testContext.password

    for (let i = 0; i < numberOfNotesToExceedThe1MBTransferLimit; i++) {
      await testContext.createSyncedNote(`note ${i}`, buffer.toString())
      await testContext.sync()
    }
    await testContext.deinit()

    const secondContext = await Factory.createAppContextWithFakeCrypto(Math.random(), email, password)
    await secondContext.launch()
    const firstSyncPromise = secondContext.awaitNextSyncEvent(SyncEvent.PaginatedSyncRequestCompleted)
    await secondContext.signIn()

    const firstSyncResult = await firstSyncPromise

    expect(firstSyncResult.retrievedPayloads.length > 0).to.be.true
    expect(firstSyncResult.retrievedPayloads.length < numberOfNotesToExceedThe1MBTransferLimit).to.be.true
    expect(firstSyncResult.successResponseData.cursor_token).not.to.be.undefined

    expect(secondContext.noteCount).to.equal(numberOfNotesToExceedThe1MBTransferLimit)

    await secondContext.deinit()
  }).timeout(Factory.SixtySecondTimeout)

  it('syncing an item should storage it encrypted', async function () {
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    await application.sync.sync(syncOptions)
    expectedItemCount++
    const rawPayloads = await application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
  })

  it('syncing an item before data load should storage it encrypted', async function () {
    const note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    expectedItemCount++

    /** Simulate database not loaded */
    await application.sync.clearSyncPositionTokens()
    application.sync.ut_setDatabaseLoaded(false)
    application.sync.sync(syncOptions)
    await Factory.sleep(0.3)

    const rawPayloads = await application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
  })

  it('saving an item after sync should persist it with content property', async function () {
    const note = await Factory.createMappedNote(application)
    const text = Factory.randomString(10000)
    await application.changeAndSaveItem.execute(
      note,
      (mutator) => {
        mutator.text = text
      },
      undefined,
      undefined,
      syncOptions,
    )
    expectedItemCount++
    const rawPayloads = await application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
    expect(notePayload.content.length).to.be.above(text.length)
  })

  it('syncing a new item before local data has loaded should still persist the item to disk', async function () {
    application.sync.ut_setDatabaseLoaded(false)
    /** You don't want to clear model manager state as we'll lose encrypting items key */
    // await application.payloads.resetState();
    await application.sync.clearSyncPositionTokens()
    expect(application.items.getDirtyItems().length).to.equal(0)

    let note = await Factory.createMappedNote(application)
    note = await application.mutator.changeItem(note, (mutator) => {
      mutator.text = `${Math.random()}`
    })
    /** This sync request should exit prematurely as we called ut_setDatabaseNotLoaded */
    /** Do not await. Sleep instead. */
    application.sync.sync(syncOptions)
    await Factory.sleep(0.3)
    expectedItemCount++

    /** Item should still be dirty */
    expect(note.dirty).to.equal(true)
    expect(application.items.getDirtyItems().length).to.equal(1)

    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
    const rawPayload = rawPayloads.find((p) => p.uuid === note.uuid)
    expect(rawPayload.uuid).to.equal(note.uuid)
    expect(rawPayload.dirty).equal(true)
    expect(typeof rawPayload.content).to.equal('string')

    /** Clear state data and upload item from storage to server */
    await application.sync.clearSyncPositionTokens()
    await application.payloads.resetState()
    await application.items.resetState()
    await application.sync.loadDatabasePayloads()
    await application.sync.sync(syncOptions)

    const newRawPayloads = await application.storage.getAllRawPayloads()
    expect(newRawPayloads.length).to.equal(expectedItemCount)

    const currentItem = application.items.findItem(note.uuid)
    expect(currentItem.content.text).to.equal(note.content.text)
    expect(currentItem.text).to.equal(note.text)
    expect(currentItem.dirty).to.not.be.ok
  })

  it('load local items should respect sort priority', function () {
    const contentTypes = ['A', 'B', 'C']
    const itemCount = 6
    const originalPayloads = []
    for (let i = 0; i < itemCount; i++) {
      const payload = Factory.createStorageItemPayload(contentTypes[Math.floor(i / 2)])
      originalPayloads.push(payload)
    }
    const { contentTypePriorityPayloads } = GetSortedPayloadsByPriority(originalPayloads, {
      contentTypePriority: ['C', 'A', 'B'],
    })
    expect(contentTypePriorityPayloads[0].content_type).to.equal('C')
    expect(contentTypePriorityPayloads[2].content_type).to.equal('A')
    expect(contentTypePriorityPayloads[4].content_type).to.equal('B')
  })

  it('should sign in and retrieve large number of items', async function () {
    const largeItemCount = 50
    await Factory.createManyMappedNotes(application, largeItemCount)
    expectedItemCount += largeItemCount
    await application.sync.sync(syncOptions)

    application = await Factory.signOutApplicationAndReturnNew(application)
    await application.signIn(email, password, undefined, undefined, undefined, true)

    application.sync.ut_setDatabaseLoaded(false)
    await application.sync.loadDatabasePayloads()
    await application.sync.sync(syncOptions)

    const items = await application.items.items
    expect(items.length).to.equal(expectedItemCount)
  }).timeout(20000)

  it('valid sync date tracking', async function () {
    let note = await Factory.createMappedNote(application)
    note = await application.mutator.setItemDirty(note)
    expectedItemCount++

    expect(note.dirty).to.equal(true)
    expect(note.payload.dirtyIndex).to.be.at.most(getCurrentDirtyIndex())

    note = await application.mutator.changeItem(note, (mutator) => {
      mutator.text = `${Math.random()}`
    })
    const sync = application.sync.sync(syncOptions)
    await Factory.sleep(0.1)
    note = application.items.findItem(note.uuid)
    expect(note.lastSyncBegan).to.be.below(new Date())
    await sync
    note = application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(note.lastSyncEnd).to.be.at.least(note.lastSyncBegan)
  })

  it('syncing twice without waiting should only execute 1 online sync', async function () {
    const expectedEvents = 1
    let actualEvents = 0
    application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded && data.source === SyncSource.External) {
        actualEvents++
      }
    })
    const first = application.sync.sync()
    const second = application.sync.sync()
    await Promise.all([first, second])
    /** Sleep so that any automatic syncs that are triggered are also sent to handler above */
    await Factory.sleep(0.5)
    expect(actualEvents).to.equal(expectedEvents)
  })

  it('should keep an item dirty thats been modified after low latency sync request began', async function () {
    /**
     * If you begin a sync request that takes 20s to complete, then begin modifying an item
     * many times and attempt to sync, it will await the initial sync to complete.
     * When that completes, it will decide whether an item is still dirty or not.
     * It will do based on comparing whether item.dirtyIndex > item.globalDirtyIndexAtLastSync
     */
    let note = await Factory.createMappedNote(application)
    await application.mutator.setItemDirty(note)
    expectedItemCount++

    // client A. Don't await, we want to do other stuff.
    application.sync.ut_beginLatencySimulator(1500)
    const slowSync = application.sync.sync(syncOptions)
    await Factory.sleep(0.1)
    expect(note.dirty).to.equal(true)

    // While that sync is going on, we want to modify this item many times.
    const text = `${Math.random()}`
    note = await application.mutator.changeItem(note, (mutator) => {
      mutator.text = text
    })
    await application.mutator.setItemDirty(note)
    await application.mutator.setItemDirty(note)
    await application.mutator.setItemDirty(note)
    expect(note.payload.dirtyIndex).to.be.above(note.payload.globalDirtyIndexAtLastSync)

    // Now do a regular sync with no latency.
    application.sync.ut_endLatencySimulator()
    const midSync = application.sync.sync(syncOptions)

    await slowSync
    await midSync

    note = application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(note.lastSyncEnd).to.be.above(note.lastSyncBegan)
    expect(note.content.text).to.equal(text)

    // client B
    await application.payloads.resetState()
    await application.items.resetState()
    await application.sync.clearSyncPositionTokens()
    await application.sync.sync(syncOptions)

    // Expect that the server value and client value match, and no conflicts are created.
    expect(application.items.items.length).to.equal(expectedItemCount)
    const foundItem = application.items.findItem(note.uuid)
    expect(foundItem.content.text).to.equal(text)
    expect(foundItem.text).to.equal(text)
  })

  it('should sync an item twice if its marked dirty while a sync is ongoing', async function () {
    /** We can't track how many times an item is synced, only how many times its mapped */
    const expectedSaveCount = 2
    let actualSaveCount = 0

    /** Create an item and sync it */
    let note = await Factory.createMappedNote(application)

    application.items.addObserver(ContentType.TYPES.Note, ({ source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      }
    })

    expectedItemCount++
    application.sync.ut_beginLatencySimulator(150)

    /** Dont await */
    const syncRequest = application.sync.sync(syncOptions)

    /** Dirty the item 100ms into 150ms request */
    const newText = `${Math.random()}`

    setTimeout(
      async function () {
        await application.mutator.changeItem(note, (mutator) => {
          mutator.text = newText
        })
      }.bind(this),
      100,
    )

    /**
     * Await sync request. A sync request will perform another request if there
     * are still more dirty items, so awaiting this will perform two syncs.
     */
    await syncRequest
    expect(actualSaveCount).to.equal(expectedSaveCount)
    note = application.items.findItem(note.uuid)
    expect(note.text).to.equal(newText)
  })

  it('marking item dirty after dirty items are prepared for sync but before they are synced should sync again', async function () {
    /**
     * There is a twilight zone where items needing sync are popped, and then say about 100ms of processing before
     * we set those items' lastSyncBegan. If the item is dirtied in between these times, then item.dirtyIndex will be less than
     * item.globalDirtyIndexAtLastSync, and it will not by synced again.
     */

    const expectedSaveCount = 2
    let actualSaveCount = 0

    /** Create an item and sync it */
    let note = await Factory.createMappedNote(application)

    application.items.addObserver(ContentType.TYPES.Note, ({ source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      }
    })
    expectedItemCount++

    /** Dont await */
    const syncRequest = application.sync.sync(syncOptions)

    /** Dirty the item before lastSyncBegan is set */
    let didPerformMutatation = false
    const newText = `${Math.random()}`

    application.sync.addEventObserver(async (eventName) => {
      if (eventName === SyncEvent.SyncDidBeginProcessing && !didPerformMutatation) {
        didPerformMutatation = true
        await application.mutator.changeItem(note, (mutator) => {
          mutator.text = newText
        })
      }
    })

    await syncRequest

    expect(actualSaveCount).to.equal(expectedSaveCount)
    note = application.items.findItem(note.uuid)
    expect(note.text).to.equal(newText)
  })

  it('marking item dirty during presync save should sync again', async function () {
    const expectedSaveCount = 2
    let actualSaveCount = 0

    /** Create an item and sync it */
    let note = await Factory.createMappedNote(application)
    let didPerformMutatation = false
    const newText = `${Math.random()}`

    application.items.addObserver(ContentType.TYPES.Note, async ({ changed, source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      } else if (source === PayloadEmitSource.PreSyncSave && !didPerformMutatation) {
        didPerformMutatation = true

        const mutated = changed[0].payload.copy({
          content: { ...note.payload.content, text: newText },
          dirty: true,
          dirtyIndex: changed[0].payload.globalDirtyIndexAtLastSync + 1,
        })

        await application.mutator.emitItemFromPayload(mutated)
      }
    })

    expectedItemCount++

    /** Dont await */
    const syncRequest = application.sync.sync(syncOptions)
    await syncRequest
    expect(actualSaveCount).to.equal(expectedSaveCount)
    note = application.items.findItem(note.uuid)
    expect(note.text).to.equal(newText)
  })

  it('retreiving a remote deleted item should succeed', async function () {
    const note = await Factory.createSyncedNote(application)
    const preDeleteSyncToken = await application.sync.getLastSyncToken()
    await application.mutator.deleteItem(note)
    await application.sync.sync()
    await application.sync.setLastSyncToken(preDeleteSyncToken)
    await application.sync.sync(syncOptions)
    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('errored items should not be synced', async function () {
    const note = await Factory.createSyncedNote(application)
    expectedItemCount++
    const lastSyncBegan = note.lastSyncBegan
    const lastSyncEnd = note.lastSyncEnd

    const encrypted = await application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })

    const errored = encrypted.copy({
      errorDecrypting: true,
      dirty: true,
    })

    await application.payloads.emitPayload(errored)
    await application.sync.sync(syncOptions)

    const updatedNote = application.items.findAnyItem(note.uuid)
    expect(updatedNote.lastSyncBegan.getTime()).to.equal(lastSyncBegan.getTime())
    expect(updatedNote.lastSyncEnd.getTime()).to.equal(lastSyncEnd.getTime())
  })

  it('should not allow receiving decrypted payloads from server', async function () {
    const invalidPayload = new DecryptedPayload(
      { ...Factory.createNotePayload(), uuid: 'rejected' },
      PayloadSource.RemoteRetrieved,
    )

    const validPayload = new EncryptedPayload({
      uuid: '123',
      content_type: 'Note',
      content: '004:...',
    })

    expectedItemCount++

    const response = new ServerSyncResponse({
      data: {
        retrieved_items: [invalidPayload.ejected(), validPayload.ejected()],
      },
    })

    context.anticipateConsoleError(
      'Error decrypting payload',
      'The encrypted payload above is not a valid encrypted payload.',
    )

    await application.sync.handleSuccessServerResponse({ payloadsSavedOrSaving: [], options: {} }, response)

    expect(application.payloads.findOne(invalidPayload.uuid)).to.not.be.ok
    expect(application.payloads.findOne(validPayload.uuid)).to.be.ok
  })

  it('retrieved items should have both updated_at and updated_at_timestamps', async function () {
    const note = await Factory.createSyncedNote(application)

    expectedItemCount++

    expect(note.payload.created_at_timestamp).to.be.ok
    expect(note.payload.created_at).to.be.ok
    expect(note.payload.updated_at_timestamp).to.be.ok
    expect(note.payload.updated_at).to.be.ok
  })

  it('syncing an item with non-supported content type should not result in infinite loop', async function () {
    /**
     * When a client tries to sync an item with a server-unrecognized content type, it will
     * be returned by the server as an error conflict.
     */
    const payload = new DecryptedPayload({
      uuid: Utils.generateUuid(),
      content_type: 'Foo',
      dirty: true,
      content: {},
    })
    expectedItemCount++
    await application.mutator.emitItemsFromPayloads([payload])
    await application.sync.sync(syncOptions)

    /** Item should no longer be dirty, otherwise it would keep syncing */
    const item = application.items.findItem(payload.uuid)
    expect(item.dirty).to.not.be.ok
  })

  it('should call onPresyncSave before sync begins', async function () {
    const events = []
    application.sync.addEventObserver((event) => {
      if (event === SyncEvent.SyncDidBeginProcessing) {
        events.push('sync-will-begin')
      }
    })

    await application.sync.sync({
      onPresyncSave: () => {
        events.push('on-presync-save')
      },
    })

    expect(events[0]).to.equal('on-presync-save')
    expect(events[1]).to.equal('sync-will-begin')
  })

  it('deleting an item permanently should include it in PayloadEmitSource.PreSyncSave item change observer', async function () {
    let conditionMet = false

    application.items.streamItems([ContentType.TYPES.Note], async ({ removed, source }) => {
      if (source === PayloadEmitSource.PreSyncSave && removed.length === 1) {
        conditionMet = true
      }
    })

    const note = await Factory.createSyncedNote(application)
    await application.mutator.deleteItem(note)
    await application.sync.sync()

    expect(conditionMet).to.equal(true)
  })

  it('deleting a note on one client should update notes count on the other', async function () {
    const contextA = context
    const contextB = await Factory.createAppContextWithFakeCrypto('AppB', contextA.email, contextA.password)

    await contextB.launch()
    await contextB.signIn()

    const note = await contextA.createSyncedNote()
    await contextB.sync()

    expect(contextB.application.items.allCountableNotesCount()).to.equal(1)

    await contextA.deleteItemAndSync(note)
    await contextB.sync()

    expect(contextB.application.items.allCountableNotesCount()).to.equal(0)

    await contextB.deinit()
  })

  it('should sync note when running raw sync request for external use', async function () {
    const contextA = context
    const contextB = await Factory.createAppContextWithFakeCrypto('AppB', contextA.email, contextA.password)

    await contextB.launch()
    await contextB.signIn()

    const notePayload = Factory.createNote()

    const rawSyncRequest = await application.sync.getRawSyncRequestForExternalUse([notePayload])
    expect(rawSyncRequest).to.be.ok

    const response = await application.http.runHttp(rawSyncRequest)
    expect(response.status).to.equal(200)

    await contextB.sync()

    const note = contextB.application.items.findItem(notePayload.uuid)
    expect(note).to.be.ok

    await contextB.deinit()
  })
})
