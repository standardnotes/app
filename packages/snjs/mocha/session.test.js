import * as Factory from './lib/factory.js'
import WebDeviceInterface from './lib/web_device_interface.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('server session', function () {
  this.timeout(Factory.TenSecondTimeout)

  let application
  let email
  let password
  let newPassword

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
    newPassword = Factory.randomString()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = null
    localStorage.clear()
  })

  async function sleepUntilSessionExpires(application, basedOnAccessToken = true) {
    const currentSession = application.legacyApi.session
    const timestamp = basedOnAccessToken ? currentSession.accessToken.expiresAt : currentSession.refreshToken.expiresAt
    const timeRemaining = (timestamp - Date.now()) / 1000 // in ms
    /*
      If the token has not expired yet, we will return the remaining time.
      Else, there's no need to add a delay.
    */
    const sleepTime = timeRemaining > 0 ? timeRemaining + 1 /** Safety margin */ : 0
    await Factory.sleep(sleepTime)
  }

  async function getSessionFromStorage(application) {
    return application.storage.getValue(StorageKey.Session)
  }

  it('should succeed when a sync request is perfomed with an expired access token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    await sleepUntilSessionExpires(application)

    const response = await application.legacyApi.sync([])

    expect(response.status).to.equal(200)
  }).timeout(Factory.TwentySecondTimeout)

  it('should return the new session in the response when refreshed', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const response = await application.legacyApi.refreshSession()

    expect(response.status).to.equal(200)
    expect(response.data.session.access_token).to.be.a('string')
    expect(response.data.session.access_token).to.not.be.empty
    expect(response.data.session.refresh_expiration).to.be.a('number')
    expect(response.data.session.refresh_token).to.not.be.empty
  })

  it('should be refreshed on any api call if access token is expired', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    // Saving the current session information for later...
    const sessionBeforeSync = application.legacyApi.getSession()

    // Waiting enough time for the access token to expire, before performing a new sync request.
    await sleepUntilSessionExpires(application)

    // Performing a sync request with an expired access token.
    await application.sync.sync(syncOptions)

    // After the above sync request is completed, we obtain the session information.
    const sessionAfterSync = application.legacyApi.getSession()

    expect(sessionBeforeSync.accessToken.value).to.not.equal(sessionAfterSync.accessToken.value)
    expect(sessionBeforeSync.refreshToken.value).to.not.equal(sessionAfterSync.refreshToken.value)
    expect(sessionBeforeSync.accessToken.expiresAt).to.be.lessThan(sessionAfterSync.accessToken.expiresAt)
    // New token should expire in the future.
    expect(sessionAfterSync.accessToken.expiresAt).to.be.greaterThan(Date.now())
  }).timeout(Factory.TwentySecondTimeout)

  it('should not deadlock while renewing session', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    await sleepUntilSessionExpires(application)

    // Apply a latency simulation so that ` inProgressRefreshSessionPromise = refreshSession()` does
    // not have the chance to complete before it is assigned to the variable. This test came along with a fix
    // where runHttp does not await a pending refreshSession promise if the request being made is itself a refreshSession request.
    application.http.__latencySimulatorMs = 1000
    await application.sync.sync(syncOptions)

    const sessionAfterSync = application.legacyApi.getSession()

    expect(sessionAfterSync.accessToken.expiresAt).to.be.greaterThan(Date.now())
  }).timeout(Factory.TwentySecondTimeout)

  it('should succeed when a sync request is perfomed after signing into an ephemeral session', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })
    application = await Factory.signOutApplicationAndReturnNew(application)

    await application.signIn(email, password, false, true)

    const response = await application.legacyApi.sync([])
    expect(response.status).to.equal(200)
  })

  it('should succeed when a sync request is perfomed after registering into an ephemeral session', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })

    const response = await application.legacyApi.sync([])
    expect(response.status).to.equal(200)
  })

  it('should be consistent between storage and apiService', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const sessionFromStorage = await getSessionFromStorage(application)
    const sessionFromApiService = application.legacyApi.getSession()

    expect(sessionFromStorage.accessToken).to.equal(sessionFromApiService.accessToken.value)
    expect(sessionFromStorage.refreshToken).to.equal(sessionFromApiService.refreshToken.value)
    expect(sessionFromStorage.accessExpiration).to.equal(sessionFromApiService.accessToken.expiresAt)
    expect(sessionFromStorage.refreshExpiration).to.equal(sessionFromApiService.refreshToken.expiresAt)
    expect(sessionFromStorage.readonlyAccess).to.equal(sessionFromApiService.isReadOnly())

    await application.legacyApi.refreshSession()

    const updatedSessionFromStorage = await getSessionFromStorage(application)
    const updatedSessionFromApiService = application.legacyApi.getSession()

    expect(updatedSessionFromStorage.accessToken).to.equal(updatedSessionFromApiService.accessToken.value)
    expect(updatedSessionFromStorage.refreshToken).to.equal(updatedSessionFromApiService.refreshToken.value)
    expect(updatedSessionFromStorage.accessExpiration).to.equal(updatedSessionFromApiService.accessToken.expiresAt)
    expect(updatedSessionFromStorage.refreshExpiration).to.equal(updatedSessionFromApiService.refreshToken.expiresAt)
    expect(updatedSessionFromStorage.readonlyAccess).to.equal(updatedSessionFromApiService.isReadOnly())
  })

  it('should be performed successfully and terminate session with a valid access token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const signOutResponse = await application.legacyApi.signOut()
    expect(signOutResponse.status).to.equal(204)

    Factory.ignoreChallenges(application)
    const syncResponse = await application.legacyApi.sync([])
    expect(syncResponse.status).to.equal(401)
    expect(syncResponse.data.error.tag).to.equal('invalid-auth')
    expect(syncResponse.data.error.message).to.equal('Invalid login credentials.')
  })

  it('sign out request should be performed successfully and terminate session with expired access token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    // Waiting enough time for the access token to expire, before performing a sign out request.
    await sleepUntilSessionExpires(application)

    const signOutResponse = await application.legacyApi.signOut()
    expect(signOutResponse.status).to.equal(204)

    Factory.ignoreChallenges(application)
    const syncResponse = await application.legacyApi.sync([])
    expect(syncResponse.status).to.equal(401)
    expect(syncResponse.data.error.tag).to.equal('invalid-auth')
    expect(syncResponse.data.error.message).to.equal('Invalid login credentials.')
  }).timeout(Factory.TwentySecondTimeout)

  it('change email request should be successful with a valid access token', async function () {
    let { application, password } = await Factory.createAndInitSimpleAppContext({
      registerUser: true,
    })
    const newEmail = UuidGenerator.GenerateUuid()
    const changeEmailResponse = await application.changeEmail(newEmail, password)

    expect(changeEmailResponse.error).to.not.be.ok

    application = await Factory.signOutApplicationAndReturnNew(application)
    const loginResponse = await Factory.loginToApplication({
      application: application,
      email: newEmail,
      password: password,
    })

    expect(loginResponse).to.be.ok
    expect(loginResponse.status).to.equal(200)
    await Factory.safeDeinit(application)
  }).timeout(Factory.TwentySecondTimeout)

  it('change email request should fail with an invalid access token', async function () {
    let { application, password } = await Factory.createAndInitSimpleAppContext({
      registerUser: true,
    })

    application.storage.setValue(StorageKey.Session, {
      accessToken: 'this-is-a-fake-token-1234',
      refreshToken: 'this-is-a-fake-token-1234',
      accessExpiration: 999999999999999,
      refreshExpiration: 99999999999999,
      readonlyAccess: false,
    })
    application.sessions.initializeFromDisk()

    Factory.ignoreChallenges(application)

    const newEmail = UuidGenerator.GenerateUuid()
    const changeEmailResponse = await application.changeEmail(newEmail, password)
    expect(changeEmailResponse.error.message).to.equal('Invalid login credentials.')

    await Factory.safeDeinit(application)
  }).timeout(Factory.TwentySecondTimeout)

  it('change email request should fail with an expired refresh token', async function () {
    let { application, password } = await Factory.createAndInitSimpleAppContext({
      registerUser: true,
    })
    application.sync.lockSyncing()
    /** Waiting for the refresh token to expire. */
    await sleepUntilSessionExpires(application, false)

    Factory.ignoreChallenges(application)
    const newEmail = UuidGenerator.GenerateUuid()
    const changeEmailResponse = await application.changeEmail(newEmail, password)

    expect(changeEmailResponse).to.be.ok
    expect(changeEmailResponse.error.message).to.equal('Invalid login credentials.')

    await Factory.safeDeinit(application)
  }).timeout(Factory.ThirtySecondTimeout)

  it('change password request should be successful with a valid access token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const changePasswordResponse = await application.changePassword(password, newPassword)

    expect(changePasswordResponse.error).to.not.be.ok

    application = await Factory.signOutApplicationAndReturnNew(application)
    const loginResponse = await Factory.loginToApplication({
      application: application,
      email: email,
      password: newPassword,
    })

    expect(loginResponse).to.be.ok
    expect(loginResponse.status).to.be.equal(200)
  }).timeout(Factory.TwentySecondTimeout)

  it('change password request should be successful after the expired access token is refreshed', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    // Waiting enough time for the access token to expire.
    await sleepUntilSessionExpires(application)

    const changePasswordResponse = await application.changePassword(password, newPassword)

    expect(changePasswordResponse.error).to.not.be.ok

    application = await Factory.signOutApplicationAndReturnNew(application)
    const loginResponse = await Factory.loginToApplication({
      application: application,
      email: email,
      password: newPassword,
    })

    expect(loginResponse).to.be.ok
    expect(loginResponse.status).to.be.equal(200)
  }).timeout(Factory.TwentySecondTimeout)

  it('change password request should fail with an invalid access token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    application.storage.setValue(StorageKey.Session, {
      accessToken: 'this-is-a-fake-token-1234',
      refreshToken: 'this-is-a-fake-token-1234',
      accessExpiration: 999999999999999,
      refreshExpiration: 99999999999999,
      readonlyAccess: false,
    })
    application.sessions.initializeFromDisk()

    Factory.ignoreChallenges(application)
    const changePasswordResponse = await application.changePassword(password, newPassword)
    expect(changePasswordResponse.error.message).to.equal('Invalid login credentials.')
  })

  it('change password request should fail with an expired refresh token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    application.sync.lockSyncing()

    /** Waiting for the refresh token to expire. */
    await sleepUntilSessionExpires(application, false)

    Factory.ignoreChallenges(application)
    const changePasswordResponse = await application.changePassword(password, newPassword)

    expect(changePasswordResponse).to.be.ok
    expect(changePasswordResponse.error.message).to.equal('Invalid login credentials.')
  }).timeout(25000)

  it('should sign in successfully after signing out', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    await application.legacyApi.signOut()
    application.legacyApi.session = undefined

    await application.sessions.signIn(email, password)

    const currentSession = application.legacyApi.getSession()

    expect(currentSession).to.be.ok
    expect(currentSession.accessToken).to.be.ok
    expect(currentSession.refreshToken).to.be.ok
    expect(currentSession.accessToken.expiresAt).to.be.greaterThan(Date.now())
  })

  it('should fail when renewing a session with an expired refresh token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    application.sync.lockSyncing()

    await sleepUntilSessionExpires(application, false)

    const refreshSessionResponse = await application.legacyApi.refreshSession()

    expect(refreshSessionResponse.status).to.equal(400)
    expect(refreshSessionResponse.data.error.tag).to.equal('invalid-parameters')
    expect(refreshSessionResponse.data.error.message).to.equal('The provided parameters are not valid.')

    /*
      The access token and refresh token should be expired up to this point.
      Here we make sure that any subsequent requests will fail.
    */
    Factory.ignoreChallenges(application)
    const syncResponse = await application.legacyApi.sync([])
    expect(syncResponse.status).to.equal(401)
    expect(syncResponse.data.error.tag).to.equal('invalid-auth')
    expect(syncResponse.data.error.message).to.equal('Invalid login credentials.')
  }).timeout(Factory.TwentySecondTimeout)

  /**
   * This test is skipped due to the fact that tokens reside now in cookies and are not accessible to the client.
   * Thus it is not possible to tamper with the refresh token.
   */
  it.skip('should fail when renewing a session with an invalid refresh token', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const originalSession = application.legacyApi.getSession()

    application.storage.setValue(StorageKey.Session, {
      accessToken: originalSession.accessToken.value,
      refreshToken: 'this-is-a-fake-token-1234',
      accessExpiration: originalSession.accessToken.expiresAt,
      refreshExpiration: originalSession.refreshToken.expiresAt,
      readonlyAccess: false,
    })
    application.sessions.initializeFromDisk()

    const refreshSessionResponse = await application.legacyApi.refreshSession()

    expect(refreshSessionResponse.status).to.equal(400)
    expect(refreshSessionResponse.data.error.tag).to.equal('invalid-refresh-token')
    expect(refreshSessionResponse.data.error.message).to.equal('The refresh token is not valid.')

    // Access token should remain valid.
    const syncResponse = await application.legacyApi.sync([])
    expect(syncResponse.status).to.equal(200)
  })

  it('should fail if syncing while a session refresh is in progress', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const refreshPromise = application.legacyApi.refreshSession()
    const syncResponse = await application.legacyApi.sync([])

    expect(syncResponse.data.error).to.be.ok

    const errorMessage = 'Your account session is being renewed with the server. Please try your request again.'
    expect(syncResponse.data.error.message).to.be.equal(errorMessage)
    /** Wait for finish so that test cleans up properly */
    await refreshPromise
  })

  it('notes should be synced as expected after refreshing a session', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const notesBeforeSync = await Factory.createManyMappedNotes(application, 5)

    await sleepUntilSessionExpires(application)
    await application.sync.sync(syncOptions)
    expect(application.sync.isOutOfSync()).to.equal(false)

    application = await Factory.signOutApplicationAndReturnNew(application)
    await application.signIn(email, password, undefined, undefined, undefined, true)

    const expectedNotesUuids = notesBeforeSync.map((n) => n.uuid)
    const notesResults = await application.items.findItems(expectedNotesUuids)

    expect(notesResults.length).to.equal(notesBeforeSync.length)

    for (const aNoteBeforeSync of notesBeforeSync) {
      const noteResult = await application.items.findItem(aNoteBeforeSync.uuid)
      expect(aNoteBeforeSync.isItemContentEqualWith(noteResult)).to.equal(true)
    }
  }).timeout(Factory.TwentySecondTimeout)

  it('should prompt user for account password and sign back in on invalid session', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    email = `${Math.random()}`
    password = `${Math.random()}`
    let didPromptForSignIn = false
    const receiveChallenge = async (challenge) => {
      didPromptForSignIn = true
      appA.submitValuesForChallenge(challenge, [
        CreateChallengeValue(challenge.prompts[0], email),
        CreateChallengeValue(challenge.prompts[1], password),
      ])
    }
    const appA = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await appA.prepareForLaunch({ receiveChallenge })
    await appA.launch(true)

    await Factory.registerUserToApplication({
      application: appA,
      email: email,
      password: password,
    })

    const oldRootKey = await appA.encryption.getRootKey()

    /** Set the session as nonsense */
    appA.storage.setValue(StorageKey.Session, {
      accessToken: 'foo',
      refreshToken: 'bar',
      accessExpiration: 999999999999999,
      refreshExpiration: 999999999999999,
      readonlyAccess: false,
    })
    appA.sessions.initializeFromDisk()

    /** Perform an authenticated network request */
    await appA.sync.sync()

    /** Allow session recovery to do its thing */
    await Factory.sleep(5.0)

    expect(didPromptForSignIn).to.equal(true)
    expect(appA.legacyApi.session.accessToken.value).to.not.equal('foo')
    expect(appA.legacyApi.session.refreshToken.value).to.not.equal('bar')

    /** Expect that the session recovery replaces the global root key */
    const newRootKey = await appA.encryption.getRootKey()
    expect(oldRootKey).to.not.equal(newRootKey)

    await Factory.safeDeinit(appA)
  })

  it('should return current session in list of sessions', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const response = await application.legacyApi.getSessionsList()
    expect(response.data[0].current).to.equal(true)
  })

  it('signing out should delete session from all list', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    /** Create new session aside from existing one */
    const app2 = await Factory.createAndInitializeApplication('app2')
    await app2.signIn(email, password)

    const response = await application.legacyApi.getSessionsList()
    expect(response.data.length).to.equal(2)

    await app2.user.signOut()

    const response2 = await application.legacyApi.getSessionsList()
    expect(response2.data.length).to.equal(1)
  })

  it('revoking a session should destroy local data', async function () {
    Factory.handlePasswordChallenges(application, password)
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const app2identifier = 'app2'
    const app2 = await Factory.createAndInitializeApplication(app2identifier)
    await app2.signIn(email, password)
    const app2Deinit = new Promise((resolve) => {
      app2.setOnDeinit(() => {
        resolve()
      })
    })

    const { data: sessions } = await application.getSessions()
    const app2session = sessions.find((session) => !session.current)
    await application.revokeSession(app2session.uuid)
    void app2.sync.sync()
    await app2Deinit

    const deviceInterface = new WebDeviceInterface()
    const payloads = await deviceInterface.getAllDatabaseEntries(app2identifier)
    expect(payloads).to.be.empty
  }).timeout(Factory.TwentySecondTimeout)

  it('revoking other sessions should destroy their local data', async function () {
    Factory.handlePasswordChallenges(application, password)
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    const app2identifier = 'app2'
    const app2 = await Factory.createAndInitializeApplication(app2identifier)
    await app2.signIn(email, password)
    const app2Deinit = new Promise((resolve) => {
      app2.setOnDeinit(() => {
        resolve()
      })
    })

    await application.revokeAllOtherSessions()
    void app2.sync.sync()
    await app2Deinit

    const deviceInterface = new WebDeviceInterface()
    const payloads = await deviceInterface.getAllDatabaseEntries(app2identifier)
    expect(payloads).to.be.empty
  }).timeout(Factory.TwentySecondTimeout)

  it('signing out with invalid session token should still delete local data', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    application.storage.setValue(StorageKey.Session, {
      accessToken: undefined,
      refreshToken: undefined,
      accessExpiration: 999999999999999,
      refreshExpiration: 999999999999999,
      readonlyAccess: false,
    })
    application.sessions.initializeFromDisk()

    const storageKey = application.storage.getPersistenceKey()
    expect(localStorage.getItem(storageKey)).to.be.ok

    await application.user.signOut()
    expect(localStorage.getItem(storageKey)).to.not.be.ok
  })
})
