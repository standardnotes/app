/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
import { createNoteParams } from './lib/Items.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('history manager', () => {
  const largeCharacterChange = 25

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(function () {
    localStorage.clear()
  })

  describe('session', function () {
    beforeEach(async function () {
      this.application = await Factory.createInitAppWithFakeCrypto()
      this.historyManager = this.application.historyManager
      this.payloadManager = this.application.payloadManager
      /** Automatically optimize after every revision by setting this to 0 */
      this.historyManager.itemRevisionThreshold = 0
    })

    afterEach(async function () {
      await Factory.safeDeinit(this.application)
    })

    function setTextAndSync(application, item, text) {
      return application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.text = text
        },
        undefined,
        undefined,
        syncOptions,
      )
    }

    function deleteCharsFromString(string, amount) {
      return string.substring(0, string.length - amount)
    }

    it('create basic history entries 1', async function () {
      const item = await Factory.createSyncedNote(this.application)
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(0)

      /** Sync with same contents, should not create new entry */
      await Factory.markDirtyAndSyncItem(this.application, item)
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(0)

      /** Sync with different contents, should create new entry */
      await this.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(1)
    })

    it('first change should create revision with previous value', async function () {
      const identifier = this.application.identifier
      const item = await Factory.createSyncedNote(this.application)

      /** Simulate loading new application session */
      const context = await Factory.createAppContext({ identifier })
      await context.launch()
      expect(context.application.historyManager.sessionHistoryForItem(item).length).to.equal(0)
      await context.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      const entries = context.application.historyManager.sessionHistoryForItem(item)
      expect(entries.length).to.equal(1)
      expect(entries[0].payload.content.title).to.equal(item.content.title)
      await context.deinit()
    })

    it('creating new item and making 1 change should create 0 revisions', async function () {
      const context = await Factory.createAppContext()
      await context.launch()
      const item = await context.application.mutator.createTemplateItem(ContentType.Note, {
        references: [],
      })
      await context.application.mutator.insertItem(item)
      expect(context.application.historyManager.sessionHistoryForItem(item).length).to.equal(0)

      await context.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      expect(context.application.historyManager.sessionHistoryForItem(item).length).to.equal(0)
      await context.deinit()
    })

    it('should optimize basic entries', async function () {
      let item = await Factory.createSyncedNote(this.application)
      /**
       * Add 1 character. This typically would be discarded as an entry, but it
       * won't here because it's the first change, which we want to keep.
       */
      await setTextAndSync(this.application, item, item.content.text + '1')
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(1)

      /**
       * Changing it by one character should keep this entry,
       * since it's now the last (and will keep the first)
       */
      item = await setTextAndSync(this.application, item, item.content.text + '2')
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(2)
      /**
       * Change it over the largeCharacterChange threshold. It should keep this
       * revision, but now remove the previous revision, since it's no longer
       * the last, and is a small change.
       */
      item = await setTextAndSync(
        this.application,
        item,
        item.content.text + Factory.randomString(largeCharacterChange + 1),
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(2)

      item = await setTextAndSync(
        this.application,
        item,
        item.content.text + Factory.randomString(largeCharacterChange + 1),
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(2)
      /** Delete over threshold text. */
      item = await setTextAndSync(
        this.application,
        item,
        deleteCharsFromString(item.content.text, largeCharacterChange + 1),
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(3)
      /**
       * Delete just 1 character. It should now retain the previous revision, as well as the
       * one previous to that.
       */
      item = await setTextAndSync(this.application, item, deleteCharsFromString(item.content.text, 1))
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(4)
      item = await setTextAndSync(this.application, item, deleteCharsFromString(item.content.text, 1))
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(5)
    })

    it('should keep the entry right before a large deletion, regardless of its delta', async function () {
      const payload = new DecryptedPayload(
        createNoteParams({
          text: Factory.randomString(100),
        }),
      )
      let item = await this.application.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
      await this.application.itemManager.setItemDirty(item)
      await this.application.syncService.sync(syncOptions)
      /** It should keep the first and last by default */
      item = await setTextAndSync(this.application, item, item.content.text)
      item = await setTextAndSync(this.application, item, item.content.text + Factory.randomString(1))
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(2)
      item = await setTextAndSync(
        this.application,
        item,
        deleteCharsFromString(item.content.text, largeCharacterChange + 1),
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(2)
      item = await setTextAndSync(this.application, item, item.content.text + Factory.randomString(1))
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(3)
      item = await setTextAndSync(
        this.application,
        item,
        item.content.text + Factory.randomString(largeCharacterChange + 1),
      )
      expect(this.historyManager.sessionHistoryForItem(item).length).to.equal(4)
    })

    it('entries should be ordered from newest to oldest', async function () {
      const payload = new DecryptedPayload(
        createNoteParams({
          text: Factory.randomString(200),
        }),
      )

      let item = await this.application.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)

      await this.application.itemManager.setItemDirty(item)
      await this.application.syncService.sync(syncOptions)

      item = await setTextAndSync(this.application, item, item.content.text + Factory.randomString(1))

      item = await setTextAndSync(
        this.application,
        item,
        deleteCharsFromString(item.content.text, largeCharacterChange + 1),
      )

      item = await setTextAndSync(this.application, item, item.content.text + Factory.randomString(1))

      item = await setTextAndSync(
        this.application,
        item,
        item.content.text + Factory.randomString(largeCharacterChange + 1),
      )

      /** First entry should be the latest revision. */
      const latestRevision = this.historyManager.sessionHistoryForItem(item)[0]
      /** Last entry should be the initial revision. */
      const initialRevision =
        this.historyManager.sessionHistoryForItem(item)[this.historyManager.sessionHistoryForItem(item).length - 1]

      expect(latestRevision).to.not.equal(initialRevision)

      expect(latestRevision.textCharDiffLength).to.equal(1)
      expect(initialRevision.textCharDiffLength).to.equal(200)
      /** Finally, the latest revision updated_at value date should be more recent than the initial revision one. */
      expect(latestRevision.itemFromPayload().userModifiedDate).to.be.greaterThan(
        initialRevision.itemFromPayload().userModifiedDate,
      )
    }).timeout(10000)

    it('unsynced entries should use payload created_at for preview titles', async function () {
      const payload = Factory.createNotePayload()
      await this.application.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
      const item = this.application.items.findItem(payload.uuid)
      await this.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      const historyItem = this.historyManager.sessionHistoryForItem(item)[0]
      expect(historyItem.previewTitle()).to.equal(historyItem.payload.created_at.toLocaleString())
    })
  })

  describe('remote', function () {
    beforeEach(async function () {
      this.application = await Factory.createInitAppWithFakeCrypto()
      this.historyManager = this.application.historyManager
      this.payloadManager = this.application.payloadManager
      this.email = UuidGenerator.GenerateUuid()
      this.password = UuidGenerator.GenerateUuid()
      await Factory.registerUserToApplication({
        application: this.application,
        email: this.email,
        password: this.password,
      })
    })

    afterEach(async function () {
      await Factory.safeDeinit(this.application)
    })

    it('response from server should be empty if not signed in', async function () {
      await this.application.user.signOut()
      this.application = await Factory.createInitAppWithFakeCrypto()
      this.historyManager = this.application.historyManager
      this.payloadManager = this.application.payloadManager
      const item = await Factory.createSyncedNote(this.application)
      await this.application.syncService.sync(syncOptions)
      const itemHistory = await this.historyManager.remoteHistoryForItem(item)
      expect(itemHistory).to.be.undefined
    })

    it('create basic history entries 2', async function () {
      const item = await Factory.createSyncedNote(this.application)
      let itemHistory = await this.historyManager.remoteHistoryForItem(item)

      /** Server history should save initial revision */
      expect(itemHistory).to.be.ok
      expect(itemHistory.length).to.equal(1)

      /** Sync within 5 minutes, should not create a new entry */
      await Factory.markDirtyAndSyncItem(this.application, item)
      itemHistory = await this.historyManager.remoteHistoryForItem(item)
      expect(itemHistory.length).to.equal(1)

      /** Sync with different contents, should not create a new entry */
      await this.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      itemHistory = await this.historyManager.remoteHistoryForItem(item)
      expect(itemHistory.length).to.equal(1)
    })

    it('returns revisions from server', async function () {
      let item = await Factory.createSyncedNote(this.application)

      await Factory.sleep(Factory.ServerRevisionFrequency)
      /** Sync with different contents, should create new entry */
      const newTitleAfterFirstChange = `The title should be: ${Math.random()}`
      await this.application.mutator.changeAndSaveItem(
        item,
        (mutator) => {
          mutator.title = newTitleAfterFirstChange
        },
        undefined,
        undefined,
        syncOptions,
      )
      let itemHistory = await this.historyManager.remoteHistoryForItem(item)
      expect(itemHistory.length).to.equal(2)

      const oldestEntry = lastElement(itemHistory)
      let revisionFromServer = await this.historyManager.fetchRemoteRevision(item, oldestEntry)
      expect(revisionFromServer).to.be.ok

      let payloadFromServer = revisionFromServer.payload
      expect(payloadFromServer.errorDecrypting).to.be.undefined
      expect(payloadFromServer.uuid).to.eq(item.payload.uuid)
      expect(payloadFromServer.content).to.eql(item.payload.content)

      item = this.application.itemManager.findItem(item.uuid)
      expect(payloadFromServer.content).to.not.eql(item.payload.content)
    })

    it('duplicate revisions should not have the originals uuid', async function () {
      const note = await Factory.createSyncedNote(this.application)
      await Factory.markDirtyAndSyncItem(this.application, note)
      const dupe = await this.application.itemManager.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(this.application, dupe)

      const dupeHistory = await this.historyManager.remoteHistoryForItem(dupe)
      const dupeRevision = await this.historyManager.fetchRemoteRevision(dupe, dupeHistory[0])
      expect(dupeRevision.payload.uuid).to.equal(dupe.uuid)
    })

    it.skip('revisions count matches original for duplicated items', async function () {
      /**
       * We can't handle duplicate item revision because the server copies over revisions
       * via a background job which we can't predict the timing of. This test is thus invalid.
       */
      const note = await Factory.createSyncedNote(this.application)

      /** Make a few changes to note */
      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(this.application, note)

      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(this.application, note)

      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(this.application, note)

      const dupe = await this.application.itemManager.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(this.application, dupe)

      const expectedRevisions = 3
      const noteHistory = await this.historyManager.remoteHistoryForItem(note)
      const dupeHistory = await this.historyManager.remoteHistoryForItem(dupe)
      expect(noteHistory.length).to.equal(expectedRevisions)
      expect(dupeHistory.length).to.equal(expectedRevisions)
    })

    it.skip('can decrypt revisions for duplicate_of items', async function () {
      /**
       * We can't handle duplicate item revision because the server copies over revisions
       * via a background job which we can't predict the timing of. This test is thus invalid.
       */
      const note = await Factory.createSyncedNote(this.application)
      await Factory.sleep(Factory.ServerRevisionFrequency)
      const changedText = `${Math.random()}`
      /** Make a few changes to note */
      await this.application.mutator.changeAndSaveItem(note, (mutator) => {
        mutator.title = changedText
      })
      await Factory.markDirtyAndSyncItem(this.application, note)

      const dupe = await this.application.itemManager.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(this.application, dupe)
      const itemHistory = await this.historyManager.remoteHistoryForItem(dupe)
      expect(itemHistory.length).to.be.above(1)
      const oldestRevision = lastElement(itemHistory)

      const fetched = await this.historyManager.fetchRemoteRevision(dupe, oldestRevision)
      expect(fetched.payload.errorDecrypting).to.not.be.ok
      expect(fetched.payload.content.title).to.equal(changedText)
    })
  })
})
