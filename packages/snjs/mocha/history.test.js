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

  describe('session', function () {
    let application, history

    beforeEach(async function () {
      localStorage.clear()

      application = await Factory.createInitAppWithFakeCrypto()
      history = application.dependencies.get(TYPES.HistoryManager)

      /** Automatically optimize after every revision by setting this to 0 */
      history.itemRevisionThreshold = 0
    })

    afterEach(async function () {
      await Factory.safeDeinit(application)
      localStorage.clear()
    })

    async function setTextAndSync(application, item, text) {
      const result = await application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.text = text
        },
        undefined,
        undefined,
        syncOptions,
      )

      return result.getValue()
    }

    function deleteCharsFromString(string, amount) {
      return string.substring(0, string.length - amount)
    }

    it('create basic history entries 1', async function () {
      const item = await Factory.createSyncedNote(application)
      expect(history.sessionHistoryForItem(item).length).to.equal(0)

      /** Sync with same contents, should not create new entry */
      await Factory.markDirtyAndSyncItem(application, item)
      expect(history.sessionHistoryForItem(item).length).to.equal(0)

      /** Sync with different contents, should create new entry */
      await application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      expect(history.sessionHistoryForItem(item).length).to.equal(1)
    })

    it('first change should create revision with previous value', async function () {
      const identifier = application.identifier
      const item = await Factory.createSyncedNote(application)

      /** Simulate loading new application session */
      const context = await Factory.createAppContext({ identifier })
      await context.launch()
      expect(context.history.sessionHistoryForItem(item).length).to.equal(0)
      await context.application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      const entries = context.history.sessionHistoryForItem(item)
      expect(entries.length).to.equal(1)
      expect(entries[0].payload.content.title).to.equal(item.content.title)
      await context.deinit()
    })

    it('creating new item and making 1 change should create 0 revisions', async function () {
      const context = await Factory.createAppContext()
      await context.launch()
      const item = await context.application.items.createTemplateItem(ContentType.TYPES.Note, {
        references: [],
      })
      await context.application.mutator.insertItem(item)
      expect(context.history.sessionHistoryForItem(item).length).to.equal(0)

      await context.application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      expect(context.history.sessionHistoryForItem(item).length).to.equal(0)
      await context.deinit()
    })

    it('should optimize basic entries', async function () {
      let item = await Factory.createSyncedNote(application)
      /**
       * Add 1 character. This typically would be discarded as an entry, but it
       * won't here because it's the first change, which we want to keep.
       */
      await setTextAndSync(application, item, item.content.text + '1')
      expect(history.sessionHistoryForItem(item).length).to.equal(1)

      /**
       * Changing it by one character should keep this entry,
       * since it's now the last (and will keep the first)
       */
      item = await setTextAndSync(application, item, item.content.text + '2')
      expect(history.sessionHistoryForItem(item).length).to.equal(2)
      /**
       * Change it over the largeCharacterChange threshold. It should keep this
       * revision, but now remove the previous revision, since it's no longer
       * the last, and is a small change.
       */
      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(largeCharacterChange + 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(2)

      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(largeCharacterChange + 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(2)
      /** Delete over threshold text. */
      item = await setTextAndSync(application, item, deleteCharsFromString(item.content.text, largeCharacterChange + 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(3)
      /**
       * Delete just 1 character. It should now retain the previous revision, as well as the
       * one previous to that.
       */
      item = await setTextAndSync(application, item, deleteCharsFromString(item.content.text, 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(4)
      item = await setTextAndSync(application, item, deleteCharsFromString(item.content.text, 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(5)
    })

    it('should keep the entry right before a large deletion, regardless of its delta', async function () {
      const payload = new DecryptedPayload(
        createNoteParams({
          text: Factory.randomString(100),
        }),
      )
      let item = await application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
      await application.mutator.setItemDirty(item)
      await application.sync.sync(syncOptions)
      /** It should keep the first and last by default */
      item = await setTextAndSync(application, item, item.content.text)
      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(1))
      expect(history.sessionHistoryForItem(item).length).to.equal(2)
      item = await setTextAndSync(application, item, deleteCharsFromString(item.content.text, largeCharacterChange + 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(2)
      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(1))
      expect(history.sessionHistoryForItem(item).length).to.equal(3)
      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(largeCharacterChange + 1))
      expect(history.sessionHistoryForItem(item).length).to.equal(4)
    })

    it('entries should be ordered from newest to oldest', async function () {
      const payload = new DecryptedPayload(
        createNoteParams({
          text: Factory.randomString(200),
        }),
      )

      let item = await application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)

      await application.mutator.setItemDirty(item)
      await application.sync.sync(syncOptions)

      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(1))

      item = await setTextAndSync(application, item, deleteCharsFromString(item.content.text, largeCharacterChange + 1))

      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(1))

      item = await setTextAndSync(application, item, item.content.text + Factory.randomString(largeCharacterChange + 1))

      /** First entry should be the latest revision. */
      const latestRevision = history.sessionHistoryForItem(item)[0]
      /** Last entry should be the initial revision. */
      const initialRevision = history.sessionHistoryForItem(item)[history.sessionHistoryForItem(item).length - 1]

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
      await application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
      const item = application.items.findItem(payload.uuid)
      await application.changeAndSaveItem.execute(
        item,
        (mutator) => {
          mutator.title = Math.random()
        },
        undefined,
        undefined,
        syncOptions,
      )
      const historyItem = history.sessionHistoryForItem(item)[0]
      expect(historyItem.previewTitle()).to.equal(historyItem.payload.created_at.toLocaleString())
    })
  })

  describe('remote', function () {
    this.timeout(Factory.TwentySecondTimeout)

    let context

    beforeEach(async function () {
      localStorage.clear()

      context = await Factory.createVaultsContextWithRealCrypto()

      await context.launch()
      await context.register()

      /**
       * Free user revisions are limited to 1 per day. This is to ensure that
       * we don't hit that limit during testing.
       */
      await context.activatePaidSubscriptionForUser()
    })

    afterEach(async function () {
      await context.deinit()
      localStorage.clear()
      sinon.restore()
      context = undefined
    })

    it('response from server should be failed if not signed in', async function () {
      const note = await context.createSyncedNote('test note')

      await context.signout()

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(true)
    })

    it('should save initial revisions on server', async () => {
      const note = await context.createSyncedNote('test note')
      expect(note).to.be.ok

      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)

      let itemHistory = itemHistoryOrError.getValue()
      if (itemHistory.length === 0) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
        expect(itemHistoryOrError.isFailed()).to.equal(false)

        itemHistory = itemHistoryOrError.getValue()
      }

      expect(itemHistory.length >= 1).to.be.true
    })

    it('should not create new revisions within the revision frequency window', async () => {
      const note = await context.createSyncedNote('test note')

      await context.changeNoteTitleAndSync(note, 'new title 1')

      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)
      let itemHistory = itemHistoryOrError.getValue()
      if (itemHistory.length === 0) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
        expect(itemHistoryOrError.isFailed()).to.equal(false)

        itemHistory = itemHistoryOrError.getValue()
      }

      expect(itemHistory.length >= 1).to.be.true
    })

    it('should create new revisions outside the revision frequency window', async function () {
      const note = await context.createSyncedNote('test note')

      await Factory.sleep(Factory.ServerRevisionFrequency)

      await context.changeNoteTitleAndSync(note, `The title should be: ${Math.random()}`)
      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)
      let itemHistory = itemHistoryOrError.getValue()
      if (itemHistory.length !== 2) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'Not enough revisions found on the server. This is likely a delay issue. Retrying...')

        const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
        expect(itemHistoryOrError.isFailed()).to.equal(false)

        itemHistory = itemHistoryOrError.getValue()
      }

      expect(itemHistory.length).to.equal(2)

      const oldestEntry = lastElement(itemHistory)
      let revisionFromServerOrError = await context.application.getRevision.execute({
        itemUuid: note.uuid,
        revisionUuid: oldestEntry.uuid,
      })
      const revisionFromServer = revisionFromServerOrError.getValue()
      expect(revisionFromServer).to.be.ok

      let payloadFromServer = revisionFromServer.payload
      expect(payloadFromServer.errorDecrypting).to.be.undefined
      expect(payloadFromServer.uuid).to.eq(note.payload.uuid)
      expect(payloadFromServer.content).to.eql(note.payload.content)

      const item = context.application.items.findItem(note.uuid)
      expect(payloadFromServer.content).to.not.eql(item.payload.content)
    })

    it('duplicate revisions should not have the originals uuid', async function () {
      const note = await context.createSyncedNote('test note')
      await Factory.markDirtyAndSyncItem(context.application, note)

      const dupe = await context.application.mutator.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(context.application, dupe)

      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const dupeHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
      expect(dupeHistoryOrError.isFailed()).to.equal(false)
      let dupeHistory = dupeHistoryOrError.getValue()
      if (dupeHistory.length === 0) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const dupeHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
        expect(dupeHistoryOrError.isFailed()).to.equal(false)

        dupeHistory = dupeHistoryOrError.getValue()
      }
      expect(dupeHistory.length >= 1).to.be.true

      const dupeRevisionOrError = await context.application.getRevision.execute({
        itemUuid: dupe.uuid,
        revisionUuid: dupeHistory[0].uuid,
      })
      const dupeRevision = dupeRevisionOrError.getValue()
      expect(dupeRevision.payload.uuid).to.equal(dupe.uuid)
    })

    it('revisions count matches original for duplicated items', async function () {
      const note = await context.createSyncedNote('test note')

      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(context.application, note)

      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(context.application, note)

      await Factory.sleep(Factory.ServerRevisionFrequency)
      await Factory.markDirtyAndSyncItem(context.application, note)

      const dupe = await context.application.mutator.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(context.application, dupe)

      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const expectedRevisions = 4
      const noteHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
      expect(noteHistoryOrError.isFailed()).to.equal(false)
      let noteHistory = noteHistoryOrError.getValue()
      if (noteHistory.length !== expectedRevisions) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const noteHistoryOrError = await context.application.listRevisions.execute({ itemUuid: note.uuid })
        expect(noteHistoryOrError.isFailed()).to.equal(false)

        noteHistory = noteHistoryOrError.getValue()
      }
      expect(noteHistory.length).to.equal(expectedRevisions)

      const dupeHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
      expect(dupeHistoryOrError.isFailed()).to.equal(false)
      let dupeHistory = dupeHistoryOrError.getValue()
      if (dupeHistory.length !== expectedRevisions + 1) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const dupeHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
        expect(dupeHistoryOrError.isFailed()).to.equal(false)

        dupeHistory = dupeHistoryOrError.getValue()
      }
      expect(dupeHistory.length).to.equal(expectedRevisions + 1)
    }).timeout(Factory.SixtySecondTimeout)

    it('can decrypt revisions for duplicate_of items', async function () {
      const note = await context.createSyncedNote('test note')
      await Factory.sleep(Factory.ServerRevisionFrequency)

      const changedText = `${Math.random()}`
      await context.changeNoteTitleAndSync(note, changedText)
      await Factory.markDirtyAndSyncItem(context.application, note)

      const dupe = await context.application.mutator.duplicateItem(note, true)
      await Factory.markDirtyAndSyncItem(context.application, dupe)

      await Factory.sleep(Factory.ServerRevisionCreationDelay)

      const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
      expect(itemHistoryOrError.isFailed()).to.equal(false)
      let itemHistory = itemHistoryOrError.getValue()
      if (itemHistory.length <= 1) {
        await Factory.sleep(Factory.ServerRevisionCreationDelay, 'No revisions found on the server. This is likely a delay issue. Retrying...')

        const itemHistoryOrError = await context.application.listRevisions.execute({ itemUuid: dupe.uuid })
        expect(itemHistoryOrError.isFailed()).to.equal(false)

        itemHistory = itemHistoryOrError.getValue()
      }
      expect(itemHistory.length).to.be.above(1)

      const newestRevision = itemHistory[0]

      const fetchedOrError = await context.application.getRevision.execute({
        itemUuid: dupe.uuid,
        revisionUuid: newestRevision.uuid,
      })
      const fetched = fetchedOrError.getValue()
      expect(fetched.payload.errorDecrypting).to.not.be.ok
      expect(fetched.payload.content.title).to.equal(changedText)
    })
  })
})
