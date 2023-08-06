import { BaseItemCounts } from './lib/BaseItemCounts.js'
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('singletons', function () {
  this.timeout(Factory.TenSecondTimeout)

  const syncOptions = {
    checkIntegrity: true,
  }

  function createPrefsPayload() {
    const params = {
      uuid: UuidGenerator.GenerateUuid(),
      content_type: ContentType.TYPES.UserPrefs,
      content: {
        foo: 'bar',
      },
    }
    return new DecryptedPayload(params)
  }

  function findOrCreatePrefsSingleton(context) {
    return context.singletons.findOrCreateContentTypeSingleton(ContentType.TYPES.UserPrefs, FillItemContent({}))
  }

  let expectedItemCount
  let application
  let context
  let email
  let password
  let registerUser
  let signIn
  let signOut
  let extManagerId
  let extPred
  let createExtMgr

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItems

    context = await Factory.createAppContext()
    await context.launch()
    application = context.application

    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()

    registerUser = async () => {
      expectedItemCount = BaseItemCounts.DefaultItemsWithAccount
      await Factory.registerUserToApplication({
        application: application,
        email: email,
        password: password,
      })
    }

    signOut = async () => {
      application = await context.signout()
    }

    signIn = async () => {
      await application.signIn(email, password, undefined, undefined, undefined, true)
    }

    extManagerId = 'org.standardnotes.extensions-manager'

    extPred = new CompoundPredicate('and', [
      new Predicate('content_type', '=', ContentType.TYPES.Component),
      new Predicate('package_info.identifier', '=', extManagerId),
    ])

    createExtMgr = () => {
      return application.mutator.createItem(
        ContentType.TYPES.Component,
        {
          package_info: {
            name: 'Extensions',
            identifier: extManagerId,
          },
        },
        true,
      )
    }
  })

  afterEach(async function () {
    expect(application.sync.isOutOfSync()).to.equal(false)
    expect(application.items.items.length).to.equal(expectedItemCount)

    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)

    await Factory.safeDeinit(application)

    localStorage.clear()
  })

  it(`only resolves to ${BaseItemCounts.DefaultItems} items`, async function () {
    /** Preferences are an item we know to always return true for isSingleton */
    const prefs1 = createPrefsPayload()
    const prefs2 = createPrefsPayload()
    const prefs3 = createPrefsPayload()

    const items = await application.mutator.emitItemsFromPayloads(
      [prefs1, prefs2, prefs3],
      PayloadEmitSource.LocalChanged,
    )
    await application.mutator.setItemsDirty(items)
    await application.sync.sync(syncOptions)
    expect(application.items.items.length).to.equal(expectedItemCount)
  })

  it('duplicate components should auto-resolve to 1', async function () {
    const extManager = await createExtMgr()
    expectedItemCount += 1

    /** Call needlessly */
    await createExtMgr()
    await createExtMgr()
    await createExtMgr()

    expect(extManager).to.be.ok

    const refreshedExtMgr = application.items.findItem(extManager.uuid)

    expect(refreshedExtMgr).to.be.ok

    await application.sync.sync(syncOptions)

    expect(application.items.itemsMatchingPredicate(ContentType.TYPES.Component, extPred).length).to.equal(1)
  })

  it('resolves via find or create', async function () {
    /* Set to never synced as singleton manager will attempt to sync before resolving */
    application.sync.ut_clearLastSyncDate()
    application.sync.ut_setDatabaseLoaded(false)
    const contentType = ContentType.TYPES.UserPrefs
    const predicate = new Predicate('content_type', '=', contentType)
    /* Start a sync right after we await singleton resolve below */
    setTimeout(() => {
      application.sync.ut_setDatabaseLoaded(true)
      application.sync.sync({
        /* Simulate the first sync occuring as that is handled specially by sync service */
        mode: SyncMode.DownloadFirst,
      })
    })
    const userPreferences = await context.singletons.findOrCreateContentTypeSingleton(contentType, {})

    expect(userPreferences).to.be.ok
    const refreshedUserPrefs = application.items.findItem(userPreferences.uuid)
    expect(refreshedUserPrefs).to.be.ok
    await application.sync.sync(syncOptions)
    expect(application.items.itemsMatchingPredicate(contentType, predicate).length).to.equal(1)
  })

  it('resolves registered predicate with signing in/out', async function () {
    await registerUser()

    await signOut()

    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()

    await createExtMgr()

    expectedItemCount += 1

    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    await signOut()

    await createExtMgr()

    await application.sync.sync(syncOptions)

    const extraSync = application.sync.sync(syncOptions)

    await signIn()

    await extraSync
  }).timeout(15000)

  it('singletons that are deleted after download first sync should not sync to server', async function () {
    await registerUser()
    await createExtMgr()
    await createExtMgr()
    await createExtMgr()
    expectedItemCount++

    let didCompleteRelevantSync = false
    let beginCheckingResponse = false
    application.sync.addEventObserver(async (eventName, data) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        beginCheckingResponse = true
      }
      if (!beginCheckingResponse) {
        return
      }
      if (!didCompleteRelevantSync && eventName === SyncEvent.PaginatedSyncRequestCompleted) {
        didCompleteRelevantSync = true
        const saved = data.savedPayloads
        expect(saved.length).to.equal(1)
        const matching = saved.find((p) => p.content_type === ContentType.TYPES.Component && p.deleted)
        expect(matching).to.not.be.ok
      }
    })
    await application.sync.sync({ mode: SyncMode.DownloadFirst })
    expect(didCompleteRelevantSync).to.equal(true)
  }).timeout(10000)

  it('signing into account and retrieving singleton shouldnt put us in deadlock', async function () {
    await registerUser()

    /** Create prefs */
    const ogPrefs = await findOrCreatePrefsSingleton(context)
    await application.sync.sync(syncOptions)

    application = await context.signout()

    /** Create another instance while signed out */
    await findOrCreatePrefsSingleton(context)

    await Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
    })

    /** After signing in, the instance retrieved from the server should be the one kept */
    const latestPrefs = await findOrCreatePrefsSingleton(context)
    expect(latestPrefs.uuid).to.equal(ogPrefs.uuid)

    const allPrefs = application.items.getItems(ogPrefs.content_type)
    expect(allPrefs.length).to.equal(1)
  })

  it('resolving singleton before first sync, then signing in, should result in correct number of instances', async function () {
    await registerUser()
    /** Create prefs and associate them with account */
    const ogPrefs = await findOrCreatePrefsSingleton(context)
    await application.sync.sync(syncOptions)
    application = await context.signout()

    /** Create another instance while signed out */
    await findOrCreatePrefsSingleton(context)
    await Factory.loginToApplication({
      application: application,
      email: email,
      password: password,
    })
    /** After signing in, the instance retrieved from the server should be the one kept */
    const latestPrefs = await findOrCreatePrefsSingleton(context)
    expect(latestPrefs.uuid).to.equal(ogPrefs.uuid)
    const allPrefs = application.items.getItems(ogPrefs.content_type)
    expect(allPrefs.length).to.equal(1)
  })

  it('if only result is errorDecrypting, create new item', async function () {
    const item = application.items.items.find((item) => item.content_type === ContentType.TYPES.UserPrefs)

    const erroredPayload = new EncryptedPayload({
      ...item.payload.ejected(),
      content: '004:...',
      errorDecrypting: true,
    })

    await application.payloads.emitPayload(erroredPayload)

    const resolvedItem = await context.singletons.findOrCreateContentTypeSingleton(item.content_type, item.content)

    await application.sync.sync({ awaitAll: true })

    expect(application.items.items.length).to.equal(expectedItemCount)
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
        identifier: extManagerId,
      },
    }

    const errorDecryptingFalse = false
    await Factory.insertItemWithOverride(
      application,
      ContentType.TYPES.Component,
      sharedContent,
      true,
      errorDecryptingFalse,
    )

    const errorDecryptingTrue = true
    const errored = await Factory.insertItemWithOverride(
      application,
      ContentType.TYPES.Component,
      sharedContent,
      true,
      errorDecryptingTrue,
    )

    expectedItemCount += 1

    await application.sync.sync(syncOptions)

    /** Now mark errored as not errorDecrypting and sync */
    const notErrored = new DecryptedPayload({
      ...errored.payload,
      content: sharedContent,
      errorDecrypting: false,
    })

    await application.payloads.emitPayload(notErrored)

    /** Item will get decrypted on current tick, so wait one before syncing */
    await Factory.sleep(0)
    await application.sync.sync(syncOptions)

    expect(application.items.itemsMatchingPredicate(ContentType.TYPES.Component, extPred).length).to.equal(1)
  })

  it('alternating the uuid of a singleton should return correct result', async function () {
    const payload = createPrefsPayload()
    const item = await application.mutator.emitItemFromPayload(payload, PayloadEmitSource.LocalChanged)
    await application.sync.sync(syncOptions)
    const predicate = new Predicate('content_type', '=', item.content_type)
    let resolvedItem = await context.singletons.findOrCreateContentTypeSingleton(payload.content_type, payload.content)
    const originalUuid = resolvedItem.uuid
    await Factory.alternateUuidForItem(application, resolvedItem.uuid)
    await application.sync.sync(syncOptions)
    const resolvedItem2 = await context.singletons.findOrCreateContentTypeSingleton(
      payload.content_type,
      payload.content,
    )
    resolvedItem = application.items.findItem(resolvedItem.uuid)
    expect(resolvedItem).to.not.be.ok
    expect(resolvedItem2.uuid).to.not.equal(originalUuid)
    expect(application.items.items.length).to.equal(expectedItemCount)
  })
})
