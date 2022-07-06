/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
import WebDeviceInterface from './lib/web_device_interface.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('singletons', function () {
  this.timeout(Factory.TenSecondTimeout)

  const syncOptions = {
    checkIntegrity: true,
  }
  const BASE_ITEM_COUNT = 2 /** Default items key, user preferences */

  function createPrefsPayload() {
    const params = {
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.UserPrefs,
      content: {
        foo: 'bar',
      },
    }
    return new DecryptedPayload(params)
  }

  function findOrCreatePrefsSingleton(application) {
    return application.singletonManager.findOrCreateContentTypeSingleton(ContentType.UserPrefs, FillItemContent({}))
  }

  beforeEach(async function () {
    localStorage.clear()
    this.expectedItemCount = BASE_ITEM_COUNT
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
    this.registerUser = async () => {
      await Factory.registerUserToApplication({
        application: this.application,
        email: this.email,
        password: this.password,
      })
    }

    this.signOut = async () => {
      this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    }

    this.signIn = async () => {
      await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    }

    this.extManagerId = 'org.standardnotes.extensions-manager'

    this.extPred = new CompoundPredicate('and', [
      new Predicate('content_type', '=', ContentType.Component),
      new Predicate('package_info.identifier', '=', this.extManagerId),
    ])

    this.createExtMgr = () => {
      return this.application.itemManager.createItem(
        ContentType.Component,
        {
          package_info: {
            name: 'Extensions',
            identifier: this.extManagerId,
          },
        },
        true,
      )
    }
  })

  afterEach(async function () {
    expect(this.application.syncService.isOutOfSync()).to.equal(false)
    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)

    const rawPayloads = await this.application.diskStorageService.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)

    await Factory.safeDeinit(this.application)

    localStorage.clear()
  })

  it(`only resolves to ${BASE_ITEM_COUNT} items`, async function () {
    /** Preferences are an item we know to always return true for isSingleton */
    const prefs1 = createPrefsPayload()
    const prefs2 = createPrefsPayload()
    const prefs3 = createPrefsPayload()

    const items = await this.application.itemManager.emitItemsFromPayloads(
      [prefs1, prefs2, prefs3],
      PayloadEmitSource.LocalChanged,
    )
    await this.application.itemManager.setItemsDirty(items)
    await this.application.syncService.sync(syncOptions)
    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
  })

  it('duplicate components should auto-resolve to 1', async function () {
    const extManager = await this.createExtMgr()
    this.expectedItemCount += 1

    /** Call needlessly */
    await this.createExtMgr()
    await this.createExtMgr()
    await this.createExtMgr()

    expect(extManager).to.be.ok

    const refreshedExtMgr = this.application.items.findItem(extManager.uuid)

    expect(refreshedExtMgr).to.be.ok

    await this.application.sync.sync(syncOptions)

    expect(this.application.itemManager.itemsMatchingPredicate(ContentType.Component, this.extPred).length).to.equal(1)
  })

  it('resolves via find or create', async function () {
    /* Set to never synced as singleton manager will attempt to sync before resolving */
    this.application.syncService.ut_clearLastSyncDate()
    this.application.syncService.ut_setDatabaseLoaded(false)
    const contentType = ContentType.UserPrefs
    const predicate = new Predicate('content_type', '=', contentType)
    /* Start a sync right after we await singleton resolve below */
    setTimeout(() => {
      this.application.syncService.ut_setDatabaseLoaded(true)
      this.application.sync.sync({
        /* Simulate the first sync occuring as that is handled specially by sync service */
        mode: SyncMode.DownloadFirst,
      })
    })
    const userPreferences = await this.application.singletonManager.findOrCreateContentTypeSingleton(contentType, {})

    expect(userPreferences).to.be.ok
    const refreshedUserPrefs = this.application.items.findItem(userPreferences.uuid)
    expect(refreshedUserPrefs).to.be.ok
    await this.application.sync.sync(syncOptions)
    expect(this.application.itemManager.itemsMatchingPredicate(contentType, predicate).length).to.equal(1)
  })

  it('resolves registered predicate with signing in/out', async function () {
    await this.registerUser()

    await this.signOut()

    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()

    await this.createExtMgr()

    this.expectedItemCount += 1

    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    await this.signOut()

    await this.createExtMgr()

    await this.application.sync.sync(syncOptions)

    const extraSync = this.application.sync.sync(syncOptions)

    await this.signIn()

    await extraSync
  }).timeout(15000)

  it('singletons that are deleted after download first sync should not sync to server', async function () {
    await this.registerUser()
    await this.createExtMgr()
    await this.createExtMgr()
    await this.createExtMgr()
    this.expectedItemCount++

    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    this.application.syncService.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        beginCheckingResponse = true
      }
      if (!beginCheckingResponse) {
        return
      }
      if (!didCompleteRelevantSync && eventName === SyncEvent.SingleRoundTripSyncCompleted) {
        didCompleteRelevantSync = true
        const saved = data.savedPayloads
        expect(saved.length).to.equal(1)
        const matching = saved.find((p) => p.content_type === ContentType.Component && p.deleted)
        expect(matching).to.not.be.ok
      }
    })
    await this.application.syncService.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
  }).timeout(10000)

  it('signing into account and retrieving singleton shouldnt put us in deadlock', async function () {
    await this.registerUser()

    /** Create prefs */
    const ogPrefs = await findOrCreatePrefsSingleton(this.application)
    await this.application.sync.sync(syncOptions)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    /** Create another instance while signed out */
    await findOrCreatePrefsSingleton(this.application)
    await Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    /** After signing in, the instance retrieved from the server should be the one kept */
    const latestPrefs = await findOrCreatePrefsSingleton(this.application)
    expect(latestPrefs.uuid).to.equal(ogPrefs.uuid)

    const allPrefs = this.application.itemManager.getItems(ogPrefs.content_type)
    expect(allPrefs.length).to.equal(1)
  })

  it('resolving singleton before first sync, then signing in, should result in correct number of instances', async function () {
    await this.registerUser()
    /** Create prefs and associate them with account */
    const ogPrefs = await findOrCreatePrefsSingleton(this.application)
    await this.application.sync.sync(syncOptions)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    /** Create another instance while signed out */
    await findOrCreatePrefsSingleton(this.application)
    await Factory.loginToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    /** After signing in, the instance retrieved from the server should be the one kept */
    const latestPrefs = await findOrCreatePrefsSingleton(this.application)
    expect(latestPrefs.uuid).to.equal(ogPrefs.uuid)
    const allPrefs = this.application.itemManager.getItems(ogPrefs.content_type)
    expect(allPrefs.length).to.equal(1)
  })

  it('if only result is errorDecrypting, create new item', async function () {
    const item = this.application.itemManager.items.find((item) => item.content_type === ContentType.UserPrefs)

    const erroredPayload = new EncryptedPayload({
      ...item.payload.ejected(),
      content: '004:...',
      errorDecrypting: true,
    })

    await this.application.payloadManager.emitPayload(erroredPayload)

    const resolvedItem = await this.application.singletonManager.findOrCreateContentTypeSingleton(
      item.content_type,
      item.content,
    )

    await this.application.sync.sync({ awaitAll: true })

    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
    expect(resolvedItem.uuid).to.not.equal(item.uuid)
    expect(resolvedItem.errorDecrypting).to.not.be.ok
  })

  it('if two items and one is error decrypting, should resolve after download first sync', async function () {
    /**
     * While signing in, a singleton item may be inserted that hasn't yet had the chance to decrypt
     * When the singleton logic runs, it will ignore this item, and matching singletons will result
     * in just 1, meaning the two items will not be consolidated. We want to make sure that when the item
     * is then subsequently decrypted, singleton logic runs again for the item.
     */

    const sharedContent = {
      package_info: {
        name: 'Extensions',
        identifier: this.extManagerId,
      },
    }

    const errorDecryptingFalse = false
    await Factory.insertItemWithOverride(
      this.application,
      ContentType.Component,
      sharedContent,
      true,
      errorDecryptingFalse,
    )

    const errorDecryptingTrue = true
    const errored = await Factory.insertItemWithOverride(
      this.application,
      ContentType.Component,
      sharedContent,
      true,
      errorDecryptingTrue,
    )

    this.expectedItemCount += 1

    await this.application.sync.sync(syncOptions)

    /** Now mark errored as not errorDecrypting and sync */
    const notErrored = new DecryptedPayload({
      ...errored.payload,
      content: sharedContent,
      errorDecrypting: false,
    })

    await this.application.payloadManager.emitPayload(notErrored)

    /** Item will get decrypted on current tick, so wait one before syncing */
    await Factory.sleep(0)
    await this.application.syncService.sync(syncOptions)

    expect(this.application.itemManager.itemsMatchingPredicate(ContentType.Component, this.extPred).length).to.equal(1)
  })

  it('alternating the uuid of a singleton should return correct result', async function () {
    const payload = createPrefsPayload()
    const item = await this.application.itemManager.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    await this.application.syncService.sync(syncOptions)
    const predicate = new Predicate('content_type', '=', item.content_type)
    let resolvedItem = await this.application.singletonManager.findOrCreateContentTypeSingleton(
      payload.content_type,
      payload.content,
    )
    const originalUuid = resolvedItem.uuid
    await Factory.alternateUuidForItem(this.application, resolvedItem.uuid)
    await this.application.syncService.sync(syncOptions)
    const resolvedItem2 = await this.application.singletonManager.findOrCreateContentTypeSingleton(
      payload.content_type,
      payload.content,
    )
    resolvedItem = this.application.items.findItem(resolvedItem.uuid)
    expect(resolvedItem).to.not.be.ok
    expect(resolvedItem2.uuid).to.not.equal(originalUuid)
    expect(this.application.itemManager.items.length).to.equal(this.expectedItemCount)
  })
})
