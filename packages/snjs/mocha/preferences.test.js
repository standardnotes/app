/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('preferences', function () {
  beforeEach(async function () {
    localStorage.clear()
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    localStorage.clear()
  })

  function register() {
    return Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
  }

  it('sets preference', async function () {
    await this.application.setPreference('editorLeft', 300)
    expect(this.application.getPreference('editorLeft')).to.equal(300)
  })

  it('saves preference', async function () {
    await register.call(this)
    await this.application.setPreference('editorLeft', 300)
    await this.application.sync.sync()
    this.application = await Factory.signOutAndBackIn(this.application, this.email, this.password)
    const editorLeft = this.application.getPreference('editorLeft')
    expect(editorLeft).to.equal(300)
  }).timeout(10000)

  it('clears preferences on signout', async function () {
    await register.call(this)
    await this.application.setPreference('editorLeft', 300)
    await this.application.sync.sync()
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    expect(this.application.getPreference('editorLeft')).to.equal(undefined)
  })

  it('returns default value for non-existent preference', async function () {
    await register.call(this)
    const editorLeft = this.application.getPreference('editorLeft', 100)
    expect(editorLeft).to.equal(100)
  })

  it('emits an event when preferences change', async function () {
    let callTimes = 0
    this.application.addEventObserver(() => {
      callTimes++
    }, ApplicationEvent.PreferencesChanged)
    callTimes += 1
    await Factory.sleep(0) /** Await next tick */
    expect(callTimes).to.equal(1) /** App start */
    await register.call(this)
    await this.application.setPreference('editorLeft', 300)
    expect(callTimes).to.equal(2)
  })

  it('discards existing preferences when signing in', async function () {
    await register.call(this)
    await this.application.setPreference('editorLeft', 300)
    await this.application.sync.sync()
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.setPreference('editorLeft', 200)
    await this.application.signIn(this.email, this.password)
    await this.application.sync.sync({ awaitAll: true })
    const editorLeft = this.application.getPreference('editorLeft')
    expect(editorLeft).to.equal(300)
  })

  it('reads stored preferences on start without waiting for syncing to complete', async function () {
    const prefKey = 'editorLeft'
    const prefValue = 300
    const identifier = this.application.identifier

    await register.call(this)
    await this.application.setPreference(prefKey, prefValue)
    await this.application.sync.sync()

    await Factory.safeDeinit(this.application)

    this.application = Factory.createApplicationWithFakeCrypto(identifier)
    const willSyncPromise = new Promise((resolve) => {
      this.application.addEventObserver(resolve, ApplicationEvent.WillSync)
    })
    Factory.initializeApplication(this.application)
    await willSyncPromise

    expect(this.application.preferencesService.preferences).to.exist
    expect(this.application.getPreference(prefKey)).to.equal(prefValue)
  })
})
