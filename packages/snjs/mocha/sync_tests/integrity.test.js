/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('sync integrity', () => {
  const BASE_ITEM_COUNT = 2 /** Default items key, user preferences */

  before(function () {
    localStorage.clear()
  })

  after(function () {
    localStorage.clear()
  })

  beforeEach(async function () {
    this.expectedItemCount = BASE_ITEM_COUNT
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
  })

  const awaitSyncEventPromise = (application, targetEvent) => {
    return new Promise((resolve) => {
      application.syncService.addEventObserver((event) => {
        if (event === targetEvent) {
          resolve()
        }
      })
    })
  }

  afterEach(async function () {
    expect(this.application.syncService.isOutOfSync()).to.equal(false)
    const rawPayloads = await this.application.diskStorageService.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(this.expectedItemCount)
    await Factory.safeDeinit(this.application)
  })

  it('should detect when out of sync', async function () {
    const item = await this.application.itemManager.emitItemFromPayload(
      Factory.createNotePayload(),
      PayloadEmitSource.LocalChanged,
    )
    this.expectedItemCount++

    const didEnterOutOfSync = awaitSyncEventPromise(this.application, SyncEvent.EnterOutOfSync)
    await this.application.syncService.sync({ checkIntegrity: true })

    await this.application.itemManager.removeItemLocally(item)
    await this.application.syncService.sync({ checkIntegrity: true, awaitAll: true })

    await didEnterOutOfSync
  })

  it('should self heal after out of sync', async function () {
    const item = await this.application.itemManager.emitItemFromPayload(
      Factory.createNotePayload(),
      PayloadEmitSource.LocalChanged,
    )
    this.expectedItemCount++

    const didEnterOutOfSync = awaitSyncEventPromise(this.application, SyncEvent.EnterOutOfSync)
    const didExitOutOfSync = awaitSyncEventPromise(this.application, SyncEvent.ExitOutOfSync)

    await this.application.syncService.sync({ checkIntegrity: true })
    await this.application.itemManager.removeItemLocally(item)
    await this.application.syncService.sync({ checkIntegrity: true, awaitAll: true })

    await Promise.all([didEnterOutOfSync, didExitOutOfSync])
    expect(this.application.syncService.isOutOfSync()).to.equal(false)
  })
})
