/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('application instances', () => {
  const BASE_ITEM_COUNT = 2 /** Default items key, user preferences */

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async () => {
    localStorage.clear()
  })

  afterEach(async () => {
    localStorage.clear()
  })

  it('two distinct applications should not share model manager state', async () => {
    const app1 = await Factory.createAndInitializeApplication('app1')
    const app2 = await Factory.createAndInitializeApplication('app2')
    expect(app1.payloadManager).to.equal(app1.payloadManager)
    expect(app1.payloadManager).to.not.equal(app2.payloadManager)

    await Factory.createMappedNote(app1)
    expect(app1.itemManager.items.length).length.to.equal(BASE_ITEM_COUNT + 1)
    expect(app2.itemManager.items.length).to.equal(BASE_ITEM_COUNT)
    await Factory.safeDeinit(app1)
    await Factory.safeDeinit(app2)
  })

  it('two distinct applications should not share storage manager state', async () => {
    const app1 = await Factory.createAndInitializeApplication('app1')
    const app2 = await Factory.createAndInitializeApplication('app2')

    await Factory.createMappedNote(app1)
    await app1.syncService.sync(syncOptions)

    expect((await app1.diskStorageService.getAllRawPayloads()).length).length.to.equal(BASE_ITEM_COUNT + 1)
    expect((await app2.diskStorageService.getAllRawPayloads()).length).length.to.equal(BASE_ITEM_COUNT)

    await Factory.createMappedNote(app2)
    await app2.syncService.sync(syncOptions)

    expect((await app1.diskStorageService.getAllRawPayloads()).length).length.to.equal(BASE_ITEM_COUNT + 1)
    expect((await app2.diskStorageService.getAllRawPayloads()).length).length.to.equal(BASE_ITEM_COUNT + 1)
    await Factory.safeDeinit(app1)
    await Factory.safeDeinit(app2)
  })

  it('deinit application while storage persisting should be handled gracefully', async () => {
    /** This test will always succeed but should be observed for console exceptions */
    const app = await Factory.createAndInitializeApplication('app')
    /** Don't await */
    app.diskStorageService.persistValuesToDisk()
    await app.prepareForDeinit()
    await Factory.safeDeinit(app)
  })

  it('changing default host should not affect already signed in accounts', async () => {
    /** This test will always succeed but should be observed for console exceptions */
    const app = await Factory.createAndInitializeApplication(
      'app',
      Environment.Web,
      Platform.MacWeb,
      Factory.getDefaultHost(),
    )
    await Factory.registerUserToApplication({
      application: app,
      email: UuidGenerator.GenerateUuid(),
      password: 'password',
    })
    await app.prepareForDeinit()
    await Factory.safeDeinit(app)

    /** Recreate app with different host */
    const recreatedApp = await Factory.createAndInitializeApplication(
      'app',
      Environment.Web,
      Platform.MacWeb,
      'http://nonsense.host',
    )

    expect(recreatedApp.getHost()).to.not.equal('http://nonsense.host')
    expect(recreatedApp.getHost()).to.equal(Factory.getDefaultHost())
  })

  it('signing out application should delete snjs_version', async () => {
    const identifier = 'app'
    const app = await Factory.createAndInitializeApplication(identifier)

    expect(localStorage.getItem(`${identifier}-snjs_version`)).to.be.ok

    await app.user.signOut()

    expect(localStorage.getItem(`${identifier}-snjs_version`)).to.not.be.ok
  })

  it('locking application while critical func in progress should wait up to a limit', async () => {
    /** This test will always succeed but should be observed for console exceptions */
    const app = await Factory.createAndInitializeApplication('app')
    /** Don't await */
    const MaximumWaitTime = 0.5
    app.diskStorageService.executeCriticalFunction(async () => {
      /** If we sleep less than the maximum, locking should occur safely.
       * If we sleep more than the maximum, locking should occur with exception on
       * app deinit. */
      await Factory.sleep(MaximumWaitTime - 0.05)
      /** Access any deviceInterface function */
      app.diskStorageService.deviceInterface.getAllRawDatabasePayloads(app.identifier)
    })
    await app.lock()
  })

  describe('signOut()', () => {
    let testNote1
    let confirmAlert
    let deinit
    let testSNApp

    const signOutConfirmMessage = (numberOfItems) => {
      const singular = numberOfItems === 1
      return (
        `There ${singular ? 'is' : 'are'} ${numberOfItems} ${singular ? 'item' : 'items'} with unsynced changes. ` +
        'If you sign out, these changes will be lost forever. Are you sure you want to sign out?'
      )
    }

    beforeEach(async () => {
      testSNApp = await Factory.createAndInitializeApplication('test-application')
      testNote1 = await Factory.createMappedNote(testSNApp, 'Note 1', 'This is a test note!', false)
      confirmAlert = sinon.spy(testSNApp.alertService, 'confirm')
      deinit = sinon.spy(testSNApp, 'deinit')
    })

    it('shows confirmation dialog when there are unsaved changes', async () => {
      await testSNApp.itemManager.setItemDirty(testNote1)
      await testSNApp.user.signOut()

      const expectedConfirmMessage = signOutConfirmMessage(1)

      expect(confirmAlert.callCount).to.equal(1)
      expect(confirmAlert.calledWith(expectedConfirmMessage)).to.be.ok
      expect(deinit.callCount).to.equal(1)
      expect(deinit.calledWith(DeinitMode.Soft, DeinitSource.SignOut)).to.be.ok
    })

    it('does not show confirmation dialog when there are no unsaved changes', async () => {
      await testSNApp.user.signOut()

      expect(confirmAlert.callCount).to.equal(0)
      expect(deinit.callCount).to.equal(1)
      expect(deinit.calledWith(DeinitMode.Soft, DeinitSource.SignOut)).to.be.ok
    })

    it('does not show confirmation dialog when there are unsaved changes and the "force" option is set to true', async () => {
      await testSNApp.itemManager.setItemDirty(testNote1)
      await testSNApp.user.signOut(true)

      expect(confirmAlert.callCount).to.equal(0)
      expect(deinit.callCount).to.equal(1)
      expect(deinit.calledWith(DeinitMode.Soft, DeinitSource.SignOut)).to.be.ok
    })

    it('cancels sign out if confirmation dialog is rejected', async () => {
      confirmAlert.restore()
      confirmAlert = sinon.stub(testSNApp.alertService, 'confirm').callsFake((_message) => false)

      await testSNApp.itemManager.setItemDirty(testNote1)
      await testSNApp.user.signOut()

      const expectedConfirmMessage = signOutConfirmMessage(1)

      expect(confirmAlert.callCount).to.equal(1)
      expect(confirmAlert.calledWith(expectedConfirmMessage)).to.be.ok
      expect(deinit.callCount).to.equal(0)
    })
  })
})
