import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('session invalidation', function () {
  this.timeout(Factory.TwentySecondTimeout)

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(function () {
    localStorage.clear()
  })

  it('changing password on one client should invalidate other sessions', async function () {
    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()

    const contextB = await Factory.createAppContextWithFakeCrypto('other', contextA.email, contextA.password)
    await contextB.launch()
    await contextB.signIn()

    await contextB.changePassword('new-password')
    const note = await contextB.createSyncedNote()

    contextA.ignoreChallenges()

    const errorPromise = contextA.awaitNextSyncError()
    await contextA.sync()
    const error = await errorPromise

    expect(error).to.be.ok
    expect(contextA.items.findItem(note.uuid)).to.not.be.ok

    await contextA.deinit()
    await contextB.deinit()
  })

  it('changing email on one client should invalidate other sessions', async function () {
    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()

    const contextB = await Factory.createAppContextWithFakeCrypto('other', contextA.email, contextA.password)
    await contextB.launch()
    await contextB.signIn()

    const newEmail = UuidGenerator.GenerateUuid()
    await contextB.changeEmail(newEmail)
    const note = await contextB.createSyncedNote()

    contextA.ignoreChallenges()

    const errorPromise = contextA.awaitNextSyncError()
    await contextA.sync()
    const error = await errorPromise

    expect(error).to.be.ok
    expect(contextA.items.findItem(note.uuid)).to.not.be.ok

    await contextA.deinit()
    await contextB.deinit()
  })

  it('should restore session on second client by reauthenticating', async function () {
    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()

    const contextB = await Factory.createAppContextWithFakeCrypto(
      new Date().toDateString(),
      contextA.email,
      contextA.password,
    )
    await contextB.launch()
    await contextB.signIn()

    await contextB.changePassword('new-password')
    const note = await contextB.createSyncedNote('foo', 'bar')

    await contextA.restoreSession('new-password')

    const contextANote = contextA.items.findItem(note.uuid)
    expect(contextANote).to.be.ok
    expect(contextANote.errorDecrypting).to.not.be.ok
    expect(contextANote.title).to.equal('foo')
    expect(contextANote.text).to.equal('bar')

    await contextA.deinit()
    await contextB.deinit()
  })
})
