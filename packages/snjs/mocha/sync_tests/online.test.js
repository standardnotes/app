/* eslint-disable no-undef */
import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'
import * as Utils from '../lib/Utils.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('online syncing', function () {
  this.timeout(Factory.TenSecondTimeout)

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    localStorage.clear()
    this.expectedItemCount = BaseItemCounts.DefaultItemsWithAccount

    this.context = await Factory.createAppContext()
    await this.context.launch()

    this.application = this.context.application
    this.email = this.context.email
    this.password = this.context.password

    Factory.disableIntegrityAutoHeal(this.application)

    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    this.signOut = async () => {
      this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    }

    this.signIn = async () => {
      await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    }
  })

  afterEach(async function () {
    expect(this.application.sync.isOutOfSync()).to.equal(false)

    const items = this.application.items.allTrackedItems()
    expect(items.length).to.equal(this.expectedItemCount)

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
    await Factory.safeDeinit(this.application)
    localStorage.clear()
  })

  function noteObjectsFromObjects(items) {
    return items.filter((item) => item.content_type === ContentType.TYPES.Note)
  }

  it('should register and sync basic model online', async function () {
    let note = await Factory.createSyncedNote(this.application)
    this.expectedItemCount++
    expect(this.application.items.getDirtyItems().length).to.equal(0)
    note = this.application.items.findItem(note.uuid)
    expect(note.dirty).to.not.be.ok

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const notePayloads = noteObjectsFromObjects(rawPayloads)
    expect(notePayloads.length).to.equal(1)
    for (const rawNote of notePayloads) {
      expect(rawNote.dirty).to.not.be.ok
    }
  })

  it('should login and retrieve synced item', async function () {
    const note = await Factory.createSyncedNote(this.application)
    this.expectedItemCount++
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    await Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    const notes = this.application.items.getDisplayableNotes()
    expect(notes.length).to.equal(1)
    expect(notes[0].title).to.equal(note.title)
  })

  it('can complete multipage sync on sign in', async function () {
    const count = 0

    await Factory.createManyMappedNotes(this.application, count)

    this.expectedItemCount += count

    await this.application.sync.sync(syncOptions)

    this.application = await this.context.signout()

    expect(this.application.items.items.length).to.equal(BaseItemCounts.DefaultItems)

    const promise = Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    /** Throw in some random syncs to cause trouble */
    const syncCount = 30

    for (let i = 0; i < syncCount; i++) {
      this.application.sync.sync(syncOptions)
      await Factory.sleep(0.01)
    }
    await promise
    expect(promise).to.be.fulfilled

    /** Allow any unwaited syncs in for loop to complete */
    await Factory.sleep(0.5)
  }).timeout(20000)

  it('having offline data then signing in should not alternate uuid and merge with account', async function () {
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const note = await Factory.createMappedNote(this.application)
    this.expectedItemCount++
    await Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      mergeLocal: true,
    })

    const notes = this.application.items.getDisplayableNotes()
    expect(notes.length).to.equal(1)
    /** uuid should have been alternated */
    expect(notes[0].uuid).to.equal(note.uuid)
  })

  it('resolve on next timing strategy', async function () {
    const syncCount = 7
    let successes = 0
    let events = 0

    this.application.sync.ut_beginLatencySimulator(250)
    this.application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded) {
        events++
      }
    })

    const promises = []
    for (let i = 0; i < syncCount; i++) {
      promises.push(
        this.application.sync
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

    this.application.sync.ut_endLatencySimulator()
    // Since the syncs all happen after one another, extra syncs may be queued on that we are not awaiting.
    await Factory.sleep(0.5)
  })

  it('force spawn new timing strategy', async function () {
    const syncCount = 7
    let successes = 0
    let events = 0

    this.application.sync.ut_beginLatencySimulator(250)

    this.application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded) {
        events++
      }
    })

    const promises = []
    for (let i = 0; i < syncCount; i++) {
      promises.push(
        this.application.sync
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
    this.application.sync.ut_endLatencySimulator()
  })

  it('retrieving new items should not mark them as dirty', async function () {
    const originalNote = await Factory.createSyncedNote(this.application)
    this.expectedItemCount++

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const promise = new Promise((resolve) => {
      this.application.sync.addEventObserver(async (event) => {
        if (event === SyncEvent.PaginatedSyncRequestCompleted) {
          const note = this.application.items.findItem(originalNote.uuid)
          if (note) {
            expect(note.dirty).to.not.be.ok
            resolve()
          }
        }
      })
    })
    await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    await promise
  })

  it('allows saving of data after sign out', async function () {
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    const note = await Factory.createMappedNote(this.application)
    this.expectedItemCount++
    await this.application.mutator.setItemDirty(note)
    await this.application.sync.sync(syncOptions)
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const notePayload = noteObjectsFromObjects(rawPayloads)
    expect(notePayload.length).to.equal(1)
    expect(this.application.items.getDisplayableNotes().length).to.equal(1)

    // set item to be merged for when sign in occurs
    await this.application.sync.markAllItemsAsNeedingSyncAndPersist()
    expect(this.application.sync.isOutOfSync()).to.equal(false)
    expect(this.application.items.getDirtyItems().length).to.equal(BaseItemCounts.DefaultItems + 1)

    // Sign back in for next tests
    await Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    expect(this.application.items.getDirtyItems().length).to.equal(0)
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    expect(this.application.sync.isOutOfSync()).to.equal(false)
    expect(this.application.items.getDisplayableNotes().length).to.equal(1)

    for (const item of this.application.items.getDisplayableNotes()) {
      expect(item.content.title).to.be.ok
    }

    const updatedRawPayloads = await this.application.storage.getAllRawPayloads()
    for (const payload of updatedRawPayloads) {
      // if an item comes back from the server, it is saved to disk immediately without a dirty value.
      expect(payload.dirty).to.not.be.ok
    }
  })

  it('mapping should not mutate items with error decrypting state', async function () {
    const note = await Factory.createMappedNote(this.application)

    this.expectedItemCount++

    const originalTitle = note.content.title

    await this.application.mutator.setItemDirty(note)
    await this.application.sync.sync(syncOptions)

    const encrypted = CreateEncryptedServerSyncPushPayload(
      await this.application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [note.payloadRepresentation()],
        },
      }),
    )

    const errorred = new EncryptedPayload({
      ...encrypted,
      errorDecrypting: true,
    })

    const items = await this.application.mutator.emitItemsFromPayloads([errorred], PayloadEmitSource.LocalChanged)

    const mappedItem = this.application.items.findAnyItem(errorred.uuid)

    expect(typeof mappedItem.content).to.equal('string')

    const decryptedPayload = await this.application.encryption.decryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [errorred],
      },
    })

    const mappedItems2 = await this.application.mutator.emitItemsFromPayloads(
      [decryptedPayload],
      PayloadEmitSource.LocalChanged,
    )

    const mappedItem2 = mappedItems2[0]
    expect(typeof mappedItem2.content).to.equal('object')
    expect(mappedItem2.content.title).to.equal(originalTitle)
  })

  it('signing into account with pre-existing items', async function () {
    const note = await Factory.createMappedNote(this.application)
    await Factory.markDirtyAndSyncItem(this.application, note)
    this.expectedItemCount += 1

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
  })

  it('removes item from storage upon deletion', async function () {
    let note = await Factory.createMappedNote(this.application)
    this.expectedItemCount++

    await this.application.mutator.setItemDirty(note)
    await this.application.sync.sync(syncOptions)

    note = this.application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    await this.application.mutator.setItemToBeDeleted(note)
    note = this.application.items.findAnyItem(note.uuid)
    expect(note.dirty).to.equal(true)
    this.expectedItemCount--

    await this.application.sync.sync(syncOptions)
    note = this.application.items.findItem(note.uuid)
    expect(note).to.not.be.ok

    // We expect that this item is now gone for good, and no duplicate has been created.
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
    await Factory.sleep(0.5)
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
  })

  it('retrieving item with no content should correctly map local state', async function () {
    const note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)
    await this.application.sync.sync(syncOptions)

    const syncToken = await this.application.sync.getLastSyncToken()

    this.expectedItemCount++
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    // client A
    await this.application.mutator.setItemToBeDeleted(note)
    await this.application.sync.sync(syncOptions)

    // Subtract 1
    this.expectedItemCount--

    // client B
    // Clearing sync tokens wont work as server wont return deleted items.
    // Set saved sync token instead
    await this.application.sync.setLastSyncToken(syncToken)
    await this.application.sync.sync(syncOptions)

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
  })

  it('changing an item while it is being synced should sync again', async function () {
    const note = await Factory.createMappedNote(this.application)

    this.expectedItemCount++

    /** Begin syncing it with server but introduce latency so we can sneak in a delete */
    this.application.sync.ut_beginLatencySimulator(500)

    const sync = this.application.sync.sync()

    /** Sleep so sync call can begin preparations but not fully begin */

    await Factory.sleep(0.1)

    await this.application.mutator.changeItem(note, (mutator) => {
      mutator.title = 'latest title'
    })

    await sync

    this.application.sync.ut_endLatencySimulator()

    await this.application.sync.sync(syncOptions)

    const latestNote = this.application.items.findItem(note.uuid)
    expect(latestNote.title).to.equal('latest title')
  })

  it('deleting an item while it is being synced should keep deletion state', async function () {
    const note = await Factory.createMappedNote(this.application)

    this.expectedItemCount++

    /** Begin syncing it with server but introduce latency so we can sneak in a delete */
    this.application.sync.ut_beginLatencySimulator(500)

    const sync = this.application.sync.sync()

    /** Sleep so sync call can begin preparations but not fully begin */

    await Factory.sleep(0.1)

    await this.application.mutator.setItemToBeDeleted(note)

    this.expectedItemCount--

    await sync

    this.application.sync.ut_endLatencySimulator()

    await this.application.sync.sync(syncOptions)

    /** We expect that item has been deleted */
    const allItems = this.application.items.items
    expect(allItems.length).to.equal(this.expectedItemCount)
  })

  it('items that are never synced and deleted should not be uploaded to server', async function () {
    const note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)
    await this.application.mutator.setItemToBeDeleted(note)

    let success = true
    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    this.application.sync.addEventObserver((eventName, data) => {
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
    await this.application.sync.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
    expect(success).to.equal(true)
  })

  it('items that are deleted after download first sync complete should not be uploaded to server', async function () {
    /** The singleton manager may delete items are download first. We dont want those uploaded to server. */
    const note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)

    let success = true
    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    this.application.sync.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        await this.application.mutator.setItemToBeDeleted(note)
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
    await this.application.sync.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
    expect(success).to.equal(true)
  })

  it('marking an item dirty then saving to disk should retain that dirty state when restored', async function () {
    const note = await Factory.createMappedNote(this.application)

    this.expectedItemCount++

    await this.application.sync.markAllItemsAsNeedingSyncAndPersist()

    this.application.items.resetState()
    this.application.payloads.resetState()

    await this.application.sync.clearSyncPositionTokens()

    expect(this.application.items.items.length).to.equal(0)

    const rawPayloads = await this.application.storage.getAllRawPayloads()

    const encryptedPayloads = rawPayloads.map((rawPayload) => {
      return new EncryptedPayload(rawPayload)
    })

    const encryptionSplit = SplitPayloadsByEncryptionType(encryptedPayloads)

    const keyedSplit = CreateDecryptionSplitWithKeyLookup(encryptionSplit)

    const decryptionResults = await this.application.encryption.decryptSplit(keyedSplit)

    await this.application.mutator.emitItemsFromPayloads(decryptionResults, PayloadEmitSource.LocalChanged)

    expect(this.application.items.allTrackedItems().length).to.equal(this.expectedItemCount)

    const foundNote = this.application.items.findAnyItem(note.uuid)

    expect(foundNote.dirty).to.equal(true)

    await this.application.sync.sync(syncOptions)
  })

  /** Temporarily skipping due to long run time */
  it.skip('should handle uploading with sync pagination', async function () {
    const largeItemCount = SyncUpDownLimit + 10
    for (let i = 0; i < largeItemCount; i++) {
      const note = await Factory.createMappedNote(this.application)
      await this.application.mutator.setItemDirty(note)
    }

    this.expectedItemCount += largeItemCount

    await this.application.sync.sync(syncOptions)
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
  }).timeout(15000)

  /** Temporarily skipping due to long run time */
  it.skip('should handle downloading with sync pagination', async function () {
    const largeItemCount = SyncUpDownLimit + 10
    for (let i = 0; i < largeItemCount; i++) {
      const note = await Factory.createMappedNote(this.application)
      await this.application.mutator.setItemDirty(note)
    }
    /** Upload */
    this.application.sync.sync({ awaitAll: true, checkIntegrity: false })
    await this.context.awaitNextSucessfulSync()
    this.expectedItemCount += largeItemCount

    /** Clear local data */
    await this.application.payloads.resetState()
    await this.application.items.resetState()
    await this.application.sync.clearSyncPositionTokens()
    await this.application.storage.clearAllPayloads()
    expect(this.application.items.items.length).to.equal(0)

    /** Download all data */
    this.application.sync.sync(syncOptions)
    await this.context.awaitNextSucessfulSync()
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
  }).timeout(30000)

  it('syncing an item should storage it encrypted', async function () {
    const note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)
    await this.application.sync.sync(syncOptions)
    this.expectedItemCount++
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
  })

  it('syncing an item before data load should storage it encrypted', async function () {
    const note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)
    this.expectedItemCount++

    /** Simulate database not loaded */
    await this.application.sync.clearSyncPositionTokens()
    this.application.sync.ut_setDatabaseLoaded(false)
    this.application.sync.sync(syncOptions)
    await Factory.sleep(0.3)

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
  })

  it('saving an item after sync should persist it with content property', async function () {
    const note = await Factory.createMappedNote(this.application)
    const text = Factory.randomString(10000)
    await this.application.changeAndSaveItem(
      note,
      (mutator) => {
        mutator.text = text
      },
      undefined,
      undefined,
      syncOptions,
    )
    this.expectedItemCount++
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)
    expect(typeof notePayload.content).to.equal('string')
    expect(notePayload.content.length).to.be.above(text.length)
  })

  it('syncing a new item before local data has loaded should still persist the item to disk', async function () {
    this.application.sync.ut_setDatabaseLoaded(false)
    /** You don't want to clear model manager state as we'll lose encrypting items key */
    // await this.application.payloads.resetState();
    await this.application.sync.clearSyncPositionTokens()
    expect(this.application.items.getDirtyItems().length).to.equal(0)

    let note = await Factory.createMappedNote(this.application)
    note = await this.application.mutator.changeItem(note, (mutator) => {
      mutator.text = `${Math.random()}`
    })
    /** This sync request should exit prematurely as we called ut_setDatabaseNotLoaded */
    /** Do not await. Sleep instead. */
    this.application.sync.sync(syncOptions)
    await Factory.sleep(0.3)
    this.expectedItemCount++

    /** Item should still be dirty */
    expect(note.dirty).to.equal(true)
    expect(this.application.items.getDirtyItems().length).to.equal(1)

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
    const rawPayload = rawPayloads.find((p) => p.uuid === note.uuid)
    expect(rawPayload.uuid).to.equal(note.uuid)
    expect(rawPayload.dirty).equal(true)
    expect(typeof rawPayload.content).to.equal('string')

    /** Clear state data and upload item from storage to server */
    await this.application.sync.clearSyncPositionTokens()
    await this.application.payloads.resetState()
    await this.application.items.resetState()
    await this.application.sync.loadDatabasePayloads()
    await this.application.sync.sync(syncOptions)

    const newRawPayloads = await this.application.storage.getAllRawPayloads()
    expect(newRawPayloads.length).to.equal(this.expectedItemCount)

    const currentItem = this.application.items.findItem(note.uuid)
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
    await Factory.createManyMappedNotes(this.application, largeItemCount)
    this.expectedItemCount += largeItemCount
    await this.application.sync.sync(syncOptions)

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)

    this.application.sync.ut_setDatabaseLoaded(false)
    await this.application.sync.loadDatabasePayloads()
    await this.application.sync.sync(syncOptions)

    const items = await this.application.items.items
    expect(items.length).to.equal(this.expectedItemCount)
  }).timeout(20000)

  it('valid sync date tracking', async function () {
    let note = await Factory.createMappedNote(this.application)
    note = await this.application.mutator.setItemDirty(note)
    this.expectedItemCount++

    expect(note.dirty).to.equal(true)
    expect(note.payload.dirtyIndex).to.be.at.most(getCurrentDirtyIndex())

    note = await this.application.mutator.changeItem(note, (mutator) => {
      mutator.text = `${Math.random()}`
    })
    const sync = this.application.sync.sync(syncOptions)
    await Factory.sleep(0.1)
    note = this.application.items.findItem(note.uuid)
    expect(note.lastSyncBegan).to.be.below(new Date())
    await sync
    note = this.application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(note.lastSyncEnd).to.be.at.least(note.lastSyncBegan)
  })

  it('syncing twice without waiting should only execute 1 online sync', async function () {
    const expectedEvents = 1
    let actualEvents = 0
    this.application.sync.addEventObserver((event, data) => {
      if (event === SyncEvent.SyncCompletedWithAllItemsUploaded && data.source === SyncSource.External) {
        actualEvents++
      }
    })
    const first = this.application.sync.sync()
    const second = this.application.sync.sync()
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
    let note = await Factory.createMappedNote(this.application)
    await this.application.mutator.setItemDirty(note)
    this.expectedItemCount++

    // client A. Don't await, we want to do other stuff.
    this.application.sync.ut_beginLatencySimulator(1500)
    const slowSync = this.application.sync.sync(syncOptions)
    await Factory.sleep(0.1)
    expect(note.dirty).to.equal(true)

    // While that sync is going on, we want to modify this item many times.
    const text = `${Math.random()}`
    note = await this.application.mutator.changeItem(note, (mutator) => {
      mutator.text = text
    })
    await this.application.mutator.setItemDirty(note)
    await this.application.mutator.setItemDirty(note)
    await this.application.mutator.setItemDirty(note)
    expect(note.payload.dirtyIndex).to.be.above(note.payload.globalDirtyIndexAtLastSync)

    // Now do a regular sync with no latency.
    this.application.sync.ut_endLatencySimulator()
    const midSync = this.application.sync.sync(syncOptions)

    await slowSync
    await midSync

    note = this.application.items.findItem(note.uuid)
    expect(note.dirty).to.equal(false)
    expect(note.lastSyncEnd).to.be.above(note.lastSyncBegan)
    expect(note.content.text).to.equal(text)

    // client B
    await this.application.payloads.resetState()
    await this.application.items.resetState()
    await this.application.sync.clearSyncPositionTokens()
    await this.application.sync.sync(syncOptions)

    // Expect that the server value and client value match, and no conflicts are created.
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
    const foundItem = this.application.items.findItem(note.uuid)
    expect(foundItem.content.text).to.equal(text)
    expect(foundItem.text).to.equal(text)
  })

  it('should sync an item twice if its marked dirty while a sync is ongoing', async function () {
    /** We can't track how many times an item is synced, only how many times its mapped */
    const expectedSaveCount = 2
    let actualSaveCount = 0

    /** Create an item and sync it */
    let note = await Factory.createMappedNote(this.application)

    this.application.items.addObserver(ContentType.TYPES.Note, ({ source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      }
    })

    this.expectedItemCount++
    this.application.sync.ut_beginLatencySimulator(150)

    /** Dont await */
    const syncRequest = this.application.sync.sync(syncOptions)

    /** Dirty the item 100ms into 150ms request */
    const newText = `${Math.random()}`

    setTimeout(
      async function () {
        await this.application.mutator.changeItem(note, (mutator) => {
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
    note = this.application.items.findItem(note.uuid)
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
    let note = await Factory.createMappedNote(this.application)

    this.application.items.addObserver(ContentType.TYPES.Note, ({ source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      }
    })
    this.expectedItemCount++

    /** Dont await */
    const syncRequest = this.application.sync.sync(syncOptions)

    /** Dirty the item before lastSyncBegan is set */
    let didPerformMutatation = false
    const newText = `${Math.random()}`

    this.application.sync.addEventObserver(async (eventName) => {
      if (eventName === SyncEvent.SyncDidBeginProcessing && !didPerformMutatation) {
        didPerformMutatation = true
        await this.application.mutator.changeItem(note, (mutator) => {
          mutator.text = newText
        })
      }
    })

    await syncRequest

    expect(actualSaveCount).to.equal(expectedSaveCount)
    note = this.application.items.findItem(note.uuid)
    expect(note.text).to.equal(newText)
  })

  it('marking item dirty during presync save should sync again', async function () {
    const expectedSaveCount = 2
    let actualSaveCount = 0

    /** Create an item and sync it */
    let note = await Factory.createMappedNote(this.application)
    let didPerformMutatation = false
    const newText = `${Math.random()}`

    this.application.items.addObserver(ContentType.TYPES.Note, async ({ changed, source }) => {
      if (source === PayloadEmitSource.RemoteSaved) {
        actualSaveCount++
      } else if (source === PayloadEmitSource.PreSyncSave && !didPerformMutatation) {
        didPerformMutatation = true

        const mutated = changed[0].payload.copy({
          content: { ...note.payload.content, text: newText },
          dirty: true,
          dirtyIndex: changed[0].payload.globalDirtyIndexAtLastSync + 1,
        })

        await this.application.mutator.emitItemFromPayload(mutated)
      }
    })

    this.expectedItemCount++

    /** Dont await */
    const syncRequest = this.application.sync.sync(syncOptions)
    await syncRequest
    expect(actualSaveCount).to.equal(expectedSaveCount)
    note = this.application.items.findItem(note.uuid)
    expect(note.text).to.equal(newText)
  })

  it('retreiving a remote deleted item should succeed', async function () {
    const note = await Factory.createSyncedNote(this.application)
    const preDeleteSyncToken = await this.application.sync.getLastSyncToken()
    await this.application.mutator.deleteItem(note)
    await this.application.sync.sync()
    await this.application.sync.setLastSyncToken(preDeleteSyncToken)
    await this.application.sync.sync(syncOptions)
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
  })

  it('errored items should not be synced', async function () {
    const note = await Factory.createSyncedNote(this.application)
    this.expectedItemCount++
    const lastSyncBegan = note.lastSyncBegan
    const lastSyncEnd = note.lastSyncEnd

    const encrypted = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })

    const errored = encrypted.copy({
      errorDecrypting: true,
      dirty: true,
    })

    await this.application.payloads.emitPayload(errored)
    await this.application.sync.sync(syncOptions)

    const updatedNote = this.application.items.findAnyItem(note.uuid)
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

    this.expectedItemCount++

    const response = new ServerSyncResponse({
      data: {
        retrieved_items: [invalidPayload.ejected(), validPayload.ejected()],
      },
    })

    await this.application.sync.handleSuccessServerResponse({ payloadsSavedOrSaving: [], options: {} }, response)

    expect(this.application.payloads.findOne(invalidPayload.uuid)).to.not.be.ok
    expect(this.application.payloads.findOne(validPayload.uuid)).to.be.ok
  })

  it('retrieved items should have both updated_at and updated_at_timestamps', async function () {
    const note = await Factory.createSyncedNote(this.application)

    this.expectedItemCount++

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
    this.expectedItemCount++
    await this.application.mutator.emitItemsFromPayloads([payload])
    await this.application.sync.sync(syncOptions)

    /** Item should no longer be dirty, otherwise it would keep syncing */
    const item = this.application.items.findItem(payload.uuid)
    expect(item.dirty).to.not.be.ok
  })

  it('should call onPresyncSave before sync begins', async function () {
    const events = []
    this.application.sync.addEventObserver((event) => {
      if (event === SyncEvent.SyncDidBeginProcessing) {
        events.push('sync-will-begin')
      }
    })

    await this.application.sync.sync({
      onPresyncSave: () => {
        events.push('on-presync-save')
      },
    })

    expect(events[0]).to.equal('on-presync-save')
    expect(events[1]).to.equal('sync-will-begin')
  })

  it('deleting an item permanently should include it in PayloadEmitSource.PreSyncSave item change observer', async function () {
    let conditionMet = false

    this.application.streamItems([ContentType.TYPES.Note], async ({ removed, source }) => {
      if (source === PayloadEmitSource.PreSyncSave && removed.length === 1) {
        conditionMet = true
      }
    })

    const note = await Factory.createSyncedNote(this.application)
    await this.application.mutator.deleteItem(note)
    await this.application.sync.sync()

    expect(conditionMet).to.equal(true)
  })

  it('deleting a note on one client should update notes count on the other', async function () {
    const contextA = this.context
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
    const contextA = this.context
    const contextB = await Factory.createAppContextWithFakeCrypto('AppB', contextA.email, contextA.password)

    await contextB.launch()
    await contextB.signIn()

    const notePayload = Factory.createNotePayload()

    const rawSyncRequest = await this.application.sync.getRawSyncRequestForExternalUse([notePayload])
    expect(rawSyncRequest).to.be.ok

    const response = await this.application.http.runHttp(rawSyncRequest)
    expect(response.status).to.equal(200)

    await contextB.sync()

    const note = contextB.application.items.findItem(notePayload.uuid)
    expect(note).to.be.ok
  })
})
