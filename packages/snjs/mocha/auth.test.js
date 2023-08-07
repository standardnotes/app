import { BaseItemCounts } from './lib/BaseItemCounts.js'
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('basic auth', function () {
  this.timeout(Factory.TenSecondTimeout)

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  let context
  let expectedItemCount

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithFakeCrypto()

    await context.launch()

    expectedItemCount = BaseItemCounts.DefaultItemsWithAccount
  })

  afterEach(async function () {
    await context.deinit()

    localStorage.clear()

    context = undefined

    sinon.restore()
  })

  it('successfully register new account', async function () {
    const response = await context.register()
    expect(response).to.be.ok

    expect(await context.application.encryption.getRootKey()).to.be.ok
  })

  it('fails register new account with short password', async function () {
    const password = '123456'

    let error = null
    try {
      await context.application.register(context.email, password)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error.message).to.equal(
      'Your password must be at least 8 characters in length. ' +
        'For your security, please choose a longer password or, ideally, a passphrase, and try again.',
    )

    expect(await context.application.encryption.getRootKey()).to.not.be.ok
  })

  it('successfully signs out of account', async function () {
    await context.register()

    expect(await context.application.encryption.getRootKey()).to.be.ok

    await context.signout()

    expect(await context.application.encryption.getRootKey()).to.not.be.ok
    expect(context.application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyNone)
  })

  it('successfully signs in to registered account', async function () {
    await context.register()

    await context.signout()

    const response = await context.application.signIn(
      context.email,
      context.password,
      undefined,
      undefined,
      undefined,
      true,
    )
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot sign while already signed in', async function () {
    await context.register()
    await Factory.createSyncedNote(context.application)
    await context.signout()

    const response = await context.application.signIn(
      context.email,
      context.password,
      undefined,
      undefined,
      undefined,
      true,
    )
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok

    let error
    try {
      await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
  }).timeout(20000)

  it('cannot register while already signed in', async function () {
    await context.register()
    let error
    try {
      await context.register()
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot perform two sign-ins at the same time', async function () {
    await context.register()
    await context.signout()

    await Promise.all([
      (async () => {
        const response = await context.application.signIn(
          context.email,
          context.password,
          undefined,
          undefined,
          undefined,
          true,
        )
        expect(response).to.be.ok
        expect(response.data.error).to.not.be.ok
        expect(await context.application.encryption.getRootKey()).to.be.ok
      })(),
      (async () => {
        /** Make sure the first function runs first */
        await new Promise((resolve) => setTimeout(resolve))
        /** Try to sign in while the first request is going */
        let error
        try {
          await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)
        } catch (e) {
          error = e
        }
        expect(error).to.be.ok
      })(),
    ])
  }).timeout(20000)

  it('cannot perform two register operations at the same time', async function () {
    await Promise.all([
      (async () => {
        const response = await context.register()
        expect(response).to.be.ok
        expect(response.error).to.not.be.ok
        expect(await context.application.encryption.getRootKey()).to.be.ok
      })(),
      (async () => {
        /** Make sure the first function runs first */
        await new Promise((resolve) => setTimeout(resolve))
        /** Try to register in while the first request is going */
        let error
        try {
          await context.register()
        } catch (e) {
          error = e
        }
        expect(error).to.be.ok
      })(),
    ])
  }).timeout(20000)

  it('successfuly signs in after failing once', async function () {
    await context.register()
    await context.signout()

    let response = await context.application.signIn(
      context.email,
      'wrong password',
      undefined,
      undefined,
      undefined,
      true,
    )
    expect(response).to.have.property('status', 401)
    expect(response.data.error).to.be.ok

    response = await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)

    expect(response.status).to.equal(200)
    expect(response.data).to.not.haveOwnProperty('error')
  }).timeout(20000)

  it('server retrieved key params should use our client inputted value for identifier', async function () {
    /**
     * We should ensure that when we retrieve key params from the server, in order to generate a root
     * key server password for login, that the identifier used in the key params is the client side entered
     * value, and not the value returned from the server.
     *
     * Apart from wanting to minimze trust from the server, we also want to ensure that if
     * we register with an uppercase identifier, and request key params with the lowercase equivalent,
     * that even though the server performs a case-insensitive search on email fields, we correct
     * for this action locally.
     */
    const rand = `${Math.random()}`
    const uppercase = `FOO@BAR.COM${rand}`
    const lowercase = `foo@bar.com${rand}`
    /**
     * Registering with an uppercase email should still allow us to sign in
     * with lowercase email
     */
    await context.application.register(uppercase, context.password)

    const response = await context.application.sessions.retrieveKeyParams(lowercase)
    const keyParams = response.keyParams
    expect(keyParams.identifier).to.equal(lowercase)
    expect(keyParams.identifier).to.not.equal(uppercase)
  }).timeout(20000)

  it('can sign into account regardless of email case', async function () {
    const rand = `${Math.random()}`
    const uppercase = `FOO@BAR.COM${rand}`
    const lowercase = `foo@bar.com${rand}`

    const password = UuidGenerator.GenerateUuid()
    let specContext = await Factory.createAppContextWithFakeCrypto(Math.random(), lowercase, password)

    await specContext.launch()
    await specContext.register()
    await specContext.deinit()

    specContext = await Factory.createAppContextWithFakeCrypto(Math.random(), uppercase, password)

    await specContext.launch()
    const response = await specContext.signIn()

    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await specContext.application.encryption.getRootKey()).to.be.ok
    await specContext.deinit()
  }).timeout(20000)

  it('can sign into account regardless of whitespace', async function () {
    const rand = `${Math.random()}`
    const withspace = `FOO@BAR.COM${rand}   `
    const nospace = `foo@bar.com${rand}`
    /**
     * Registering with a lowercase email should allow us to sign in
     * with an uppercase email
     */
    const password = UuidGenerator.GenerateUuid()

    let specContext = await Factory.createAppContextWithFakeCrypto(Math.random(), nospace, password)
    await specContext.launch()
    await specContext.register()
    await specContext.deinit()

    specContext = await Factory.createAppContextWithFakeCrypto(Math.random(), withspace, password)
    await specContext.launch()
    const response = await specContext.signIn()

    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await specContext.application.encryption.getRootKey()).to.be.ok
    await specContext.deinit()
  }).timeout(20000)

  it('fails login with wrong password', async function () {
    await context.register()
    await context.signout()

    const response = await context.application.signIn(
      context.email,
      'wrongpassword',
      undefined,
      undefined,
      undefined,
      true,
    )
    expect(response).to.be.ok
    expect(response.data.error).to.be.ok
    expect(await context.application.encryption.getRootKey()).to.not.be.ok
  }).timeout(20000)

  it('fails to change to short password', async function () {
    await context.register()
    const newPassword = '123456'
    const response = await context.application.changePassword(context.password, newPassword)
    expect(response.error).to.be.ok
  }).timeout(20000)

  it('fails to change password when current password is incorrect', async function () {
    await context.register()
    const response = await context.application.changePassword('Invalid password', 'New password')
    expect(response.error).to.be.ok

    /** Ensure we can still log in */
    await context.signout()
    await context.signIn()
  }).timeout(20000)

  it('registering for new account and completing first after download sync should not put us out of sync', async function () {
    context.email = UuidGenerator.GenerateUuid()
    context.password = UuidGenerator.GenerateUuid()

    let outOfSync = true
    let didCompletePostDownloadFirstSync = false
    let didCompleteDownloadFirstSync = false
    context.application.sync.addEventObserver((eventName) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        didCompleteDownloadFirstSync = true
      }
      if (!didCompleteDownloadFirstSync) {
        return
      }
      if (!didCompletePostDownloadFirstSync && eventName === SyncEvent.PaginatedSyncRequestCompleted) {
        didCompletePostDownloadFirstSync = true
        /** Should be in sync */
        outOfSync = context.application.sync.isOutOfSync()
      }
    })

    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })

    expect(didCompleteDownloadFirstSync).to.equal(true)
    expect(didCompletePostDownloadFirstSync).to.equal(true)
    expect(outOfSync).to.equal(false)
  })

  it('successfully changes password', async function () {
    await context.register()

    const noteCount = 5
    await Factory.createManyMappedNotes(context.application, noteCount)
    expectedItemCount += noteCount

    await context.sync()
    expect(context.application.items.items.length).to.equal(expectedItemCount)

    const newPassword = 'newpassword'
    const response = await context.application.changePassword(context.password, newPassword)
    expect(response.error).to.not.be.ok

    expectedItemCount += ['new items key'].length
    expect(context.application.items.items.length).to.equal(expectedItemCount)
    expect(context.application.payloads.invalidPayloads.length).to.equal(0)

    await context.application.sync.markAllItemsAsNeedingSyncAndPersist()
    await context.sync(syncOptions)

    expect(context.application.items.items.length).to.equal(expectedItemCount)
  }).timeout(40000)

  it('should sign into account after changing password', async function () {
    await context.register()

    const newPassword = 'newpassword'
    const response = await context.application.changePassword(context.password, newPassword)
    expect(response.error).to.not.be.ok

    expectedItemCount += ['new items key'].length

    await context.signout()

    const signinResponse = await context.application.signIn(
      context.email,
      newPassword,
      undefined,
      undefined,
      undefined,
      true,
    )

    expect(signinResponse).to.be.ok
    expect(signinResponse.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok

    expect(context.application.items.items.length).to.equal(expectedItemCount)
    expect(context.application.payloads.invalidPayloads.length).to.equal(0)
  })

  it('successfully changes password when passcode is set', async function () {
    const passcode = 'passcode'
    await context.addPasscode(passcode)
    await context.register()

    const noteCount = 3
    await Factory.createManyMappedNotes(context.application, noteCount)
    expectedItemCount += noteCount

    await context.sync()

    const newPassword = 'newpassword'
    const response = await context.application.changePassword(context.password, newPassword)
    expect(response.error).to.not.be.ok

    expectedItemCount += ['new items key'].length

    expect(context.application.items.items.length).to.equal(expectedItemCount)
  })

  it('changes password many times', async function () {
    await context.register()

    const noteCount = 10
    await Factory.createManyMappedNotes(context.application, noteCount)
    expectedItemCount += noteCount
    await context.application.sync.sync(syncOptions)

    const numTimesToChangePw = 3
    let newPassword = Factory.randomString()
    let currentPassword = context.password

    for (let i = 0; i < numTimesToChangePw; i++) {
      await context.application.changePassword(currentPassword, newPassword)

      /** New items key */
      expectedItemCount++

      currentPassword = newPassword
      newPassword = Factory.randomString()

      expect(context.application.items.items.length).to.equal(expectedItemCount)
      expect(context.application.payloads.invalidPayloads.length).to.equal(0)

      await context.application.sync.markAllItemsAsNeedingSyncAndPersist()
      await context.application.sync.sync(syncOptions)

      await context.signout()

      expect(context.application.items.items.length).to.equal(BaseItemCounts.DefaultItems)
      expect(context.application.payloads.invalidPayloads.length).to.equal(0)

      /** Should login with new password */
      const signinResponse = await context.application.signIn(
        context.email,
        currentPassword,
        undefined,
        undefined,
        undefined,
        true,
      )

      expect(signinResponse).to.be.ok
      expect(signinResponse.data.error).to.not.be.ok
      expect(await context.application.encryption.getRootKey()).to.be.ok
    }
  }).timeout(80000)

  it('signing in with a clean email string should only try once', async function () {
    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })
    await context.signout()
    const performSignIn = sinon.spy(context.application.sessions, 'performSignIn')
    await context.application.signIn(context.email, 'wrong password', undefined, undefined, undefined, true)
    expect(performSignIn.callCount).to.equal(1)
  })

  it('should rollback password change if fails to sync new items key', async function () {
    /** Should delete the new items key locally without marking it as deleted so that it doesn't sync */
    await context.register()

    const originalImpl = context.application.encryption.getSureDefaultItemsKey
    context.application.encryption.getSureDefaultItemsKey = () => {
      return {
        neverSynced: true,
      }
    }

    const mutatorSpy = sinon.spy(context.application.mutator, 'setItemToBeDeleted')
    const removeItemsSpy = sinon.spy(context.application.items, 'removeItemsFromMemory')
    const deletePayloadsSpy = sinon.spy(context.application.storage, 'deletePayloadsWithUuids')

    await context.changePassword('new-password')

    context.application.encryption.getSureDefaultItemsKey = originalImpl

    expect(mutatorSpy.callCount).to.equal(0)
    expect(removeItemsSpy.callCount).to.equal(1)
    expect(deletePayloadsSpy.callCount).to.equal(1)
  })

  describe('add passcode', function () {
    it('should set passcode successfully', async function () {
      const passcode = 'passcode'
      const result = await context.application.addPasscode(passcode)
      expect(result).to.be.true
    })

    it('should fail when attempting to set 0 character passcode', async function () {
      const passcode = ''
      const result = await context.application.addPasscode(passcode)
      expect(result).to.be.false
    })
  })

  describe('change passcode', function () {
    it('should change passcode successfully', async function () {
      const passcode = 'passcode'
      const newPasscode = 'newPasscode'
      await context.application.addPasscode(passcode)
      Factory.handlePasswordChallenges(context.application, passcode)
      const result = await context.application.changePasscode(newPasscode)
      expect(result).to.be.true
    }).timeout(Factory.TenSecondTimeout)

    it('should fail when attempting to change to a 0 character passcode', async function () {
      const passcode = 'passcode'
      const newPasscode = ''
      await context.application.addPasscode(passcode)
      Factory.handlePasswordChallenges(context.application, passcode)
      const result = await context.application.changePasscode(newPasscode)
      expect(result).to.be.false
    }).timeout(Factory.TenSecondTimeout)
  })

  describe('account deletion', function () {
    beforeEach(async () => {
      await context.register()
    })

    it('should prompt for account password when deleting account', async function () {
      Factory.handlePasswordChallenges(context.application, context.password)

      const sendChallengeSpy = sinon.spy(context.application.challenges, 'sendChallenge')

      await context.application.user.deleteAccount()

      expect(sendChallengeSpy.callCount).to.equal(1)
    }).timeout(Factory.TenSecondTimeout)

    it('deleting account should sign out current user', async function () {
      Factory.handlePasswordChallenges(context.application, context.password)

      const signOutSpy = sinon.spy(context.application.user.sessions, 'signOut')

      await context.application.user.deleteAccount()

      expect(context.application.dealloced).to.be.true
      expect(signOutSpy.callCount).to.equal(1)
    }).timeout(Factory.TenSecondTimeout)

    it("should not allow to delete someone else's account", async function () {
      const secondContext = await Factory.createAppContextWithRealCrypto()
      await secondContext.launch()
      const registerResponse = await secondContext.register()

      const response = await context.application.dependencies
        .get(TYPES.UserApiService)
        .deleteAccount(registerResponse.user.uuid)

      expect(response.status).to.equal(401)
      expect(response.data.error.message).to.equal('Operation not allowed.')

      await secondContext.deinit()
    })
  })
})
