import { BaseItemCounts } from '../lib/BaseItemCounts.js'
import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('sync integrity', () => {
  let application
  let email
  let password
  let expectedItemCount

  beforeEach(async function () {
    localStorage.clear()
    expectedItemCount = BaseItemCounts.DefaultItemsWithAccount
    application = await Factory.createInitAppWithFakeCrypto()
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })
  })

  afterEach(async function () {
    expect(application.sync.isOutOfSync()).to.equal(false)
    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(expectedItemCount)
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  const awaitSyncEventPromise = (application, targetEvent) => {
    return new Promise((resolve) => {
      application.sync.addEventObserver((event) => {
        if (event === targetEvent) {
          resolve()
        }
      })
    })
  }

  it('should detect when out of sync', async function () {
    const item = await application.mutator.emitItemFromPayload(
      Factory.createNotePayload(),
      PayloadEmitSource.LocalChanged,
    )
    expectedItemCount++

    const didEnterOutOfSync = awaitSyncEventPromise(application, SyncEvent.EnterOutOfSync)
    await application.sync.sync({ checkIntegrity: true })

    await application.items.removeItemFromMemory(item)
    await application.sync.sync({ checkIntegrity: true, awaitAll: true })

    await didEnterOutOfSync
  })

  it('should self heal after out of sync', async function () {
    const item = await application.mutator.emitItemFromPayload(
      Factory.createNotePayload(),
      PayloadEmitSource.LocalChanged,
    )
    expectedItemCount++

    const didEnterOutOfSync = awaitSyncEventPromise(application, SyncEvent.EnterOutOfSync)
    const didExitOutOfSync = awaitSyncEventPromise(application, SyncEvent.ExitOutOfSync)

    await application.sync.sync({ checkIntegrity: true })
    await application.items.removeItemFromMemory(item)
    await application.sync.sync({ checkIntegrity: true, awaitAll: true })

    await Promise.all([didEnterOutOfSync, didExitOutOfSync])
    expect(application.sync.isOutOfSync()).to.equal(false)
  })
})
