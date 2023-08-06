import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('preferences', function () {
  let application
  let email
  let password
  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContext()
    await context.launch()
    application = context.application

    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
    context = undefined
  })

  function register() {
    return Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })
  }

  it('sets preference', async function () {
    await application.setPreference('editorLeft', 300)
    expect(application.getPreference('editorLeft')).to.equal(300)
  })

  it('saves preference', async function () {
    await register.call(this)
    await application.setPreference('editorLeft', 300)
    await application.sync.sync()
    application = await Factory.signOutAndBackIn(application, email, password)
    const editorLeft = application.getPreference('editorLeft')
    expect(editorLeft).to.equal(300)
  }).timeout(10000)

  it('clears preferences on signout', async function () {
    await register.call(this)
    await application.setPreference('editorLeft', 300)
    await application.sync.sync()
    application = await Factory.signOutApplicationAndReturnNew(application)
    expect(application.getPreference('editorLeft')).to.equal(undefined)
  })

  it('returns default value for non-existent preference', async function () {
    await register.call(this)
    const editorLeft = application.getPreference('editorLeft', 100)
    expect(editorLeft).to.equal(100)
  })

  it('emits an event when preferences change', async function () {
    const promise = new Promise((resolve) => {
      application.addEventObserver(() => {
        resolve()
      }, ApplicationEvent.PreferencesChanged)
    })

    await application.setPreference('editorLeft', 300)
    await promise
    expect(promise).to.be.fulfilled
  })

  it('discards existing preferences when signing in', async function () {
    await register.call(this)
    await application.setPreference('editorLeft', 300)
    await application.sync.sync()

    application = await context.signout()

    await application.setPreference('editorLeft', 200)
    await application.signIn(email, password)

    const promise = context.awaitUserPrefsSingletonResolution()
    await application.sync.sync({ awaitAll: true })
    await promise

    const editorLeft = application.getPreference('editorLeft')
    expect(editorLeft).to.equal(300)
  })

  it('reads stored preferences on start without waiting for syncing to complete', async function () {
    const prefKey = 'editorLeft'
    const prefValue = 300
    const identifier = application.identifier

    await register.call(this)
    await application.setPreference(prefKey, prefValue)
    await application.sync.sync()

    await Factory.safeDeinit(application)

    application = Factory.createApplicationWithFakeCrypto(identifier)
    const willSyncPromise = new Promise((resolve) => {
      application.addEventObserver(resolve, ApplicationEvent.WillSync)
    })
    Factory.initializeApplication(application)
    await willSyncPromise

    expect(application.preferences.preferences).to.exist
    expect(application.getPreference(prefKey)).to.equal(prefValue)
  })
})
