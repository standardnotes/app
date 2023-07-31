/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
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

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    this.expectedItemCount = BaseItemCounts.DefaultItemsWithAccount
  })

  it('successfully register new account', async function () {
    const response = await context.application.register(context.email, context.password)
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
    await context.application.register(context.email, context.password)

    expect(await context.application.encryption.getRootKey()).to.be.ok

    context.application = await Factory.signOutApplicationAndReturnNew(context.application)

    expect(await context.application.encryption.getRootKey()).to.not.be.ok
    expect(context.application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyNone)
  })

  it('successfully signs in to registered account', async function () {
    await context.application.register(context.email, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const response = await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot sign while already signed in', async function () {
    await context.application.register(context.email, context.password)
    await Factory.createSyncedNote(context.application)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const response = await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)
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
    await context.application.register(context.email, context.password)
    let error
    try {
      await context.application.register(context.email, context.password)
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot perform two sign-ins at the same time', async function () {
    await context.application.register(context.email, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)

    await Promise.all([
      (async () => {
        const response = await context.application.signIn(context.email, context.password, undefined, undefined, undefined, true)
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
        const response = await context.application.register(context.email, context.password)
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
          await context.application.register(context.email, context.password)
        } catch (e) {
          error = e
        }
        expect(error).to.be.ok
      })(),
    ])
  }).timeout(20000)

  it('successfuly signs in after failing once', async function () {
    await context.application.register(context.email, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)

    let response = await context.application.signIn(context.email, 'wrong password', undefined, undefined, undefined, true)
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
    /**
     * Registering with a lowercase email should allow us to sign in
     * with an uppercase email
     */
    await context.application.register(lowercase, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const response = await context.application.signIn(uppercase, context.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('can sign into account regardless of whitespace', async function () {
    const rand = `${Math.random()}`
    const withspace = `FOO@BAR.COM${rand}   `
    const nospace = `foo@bar.com${rand}`
    /**
     * Registering with a lowercase email should allow us to sign in
     * with an uppercase email
     */
    await context.application.register(nospace, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const response = await context.application.signIn(withspace, context.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await context.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('fails login with wrong password', async function () {
    await context.application.register(context.email, context.password)
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const response = await context.application.signIn(context.email, 'wrongpassword', undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.be.ok
    expect(await context.application.encryption.getRootKey()).to.not.be.ok
  }).timeout(20000)

  it('fails to change to short password', async function () {
    await context.application.register(context.email, context.password)
    const newPassword = '123456'
    const response = await context.application.changePassword(context.password, newPassword)
    expect(response.error).to.be.ok
  }).timeout(20000)

  it('fails to change password when current password is incorrect', async function () {
    await context.application.register(context.email, context.password)
    const response = await context.application.changePassword('Invalid password', 'New password')
    expect(response.error).to.be.ok

    /** Ensure we can still log in */
    context.application = await Factory.signOutAndBackIn(context.application, context.email, context.password)
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

  async function changePassword() {
    await context.application.register(context.email, context.password)

    const noteCount = 10

    await Factory.createManyMappedNotes(context.application, noteCount)

    this.expectedItemCount += noteCount

    await context.application.sync.sync(syncOptions)

    expect(context.application.items.items.length).to.equal(this.expectedItemCount)

    const newPassword = 'newpassword'
    const response = await context.application.changePassword(context.password, newPassword)

    /** New items key */
    this.expectedItemCount++

    expect(context.application.items.items.length).to.equal(this.expectedItemCount)

    expect(response.error).to.not.be.ok
    expect(context.application.items.items.length).to.equal(this.expectedItemCount)
    expect(context.application.payloads.invalidPayloads.length).to.equal(0)

    await context.application.sync.markAllItemsAsNeedingSyncAndPersist()
    await context.application.sync.sync(syncOptions)

    expect(context.application.items.items.length).to.equal(this.expectedItemCount)

    const note = context.application.items.getDisplayableNotes()[0]

    /**
     * Create conflict for a note. First modify the item without saving so that
     * our local contents digress from the server's
     */
    await context.application.mutator.changeItem(note, (mutator) => {
      mutator.title = `${Math.random()}`
    })

    await Factory.changePayloadTimeStampAndSync(
      context.application,
      note.payload,
      Factory.dateToMicroseconds(Factory.yesterday()),
      {
        title: `${Math.random()}`,
      },
      syncOptions,
    )
    this.expectedItemCount++

    context.application = await Factory.signOutApplicationAndReturnNew(context.application)

    /** Should login with new password */
    const signinResponse = await context.application.signIn(context.email, newPassword, undefined, undefined, undefined, true)

    expect(signinResponse).to.be.ok
    expect(signinResponse.data.error).to.not.be.ok

    expect(await context.application.encryption.getRootKey()).to.be.ok

    expect(context.application.items.items.length).to.equal(this.expectedItemCount)
    expect(context.application.payloads.invalidPayloads.length).to.equal(0)
  }

  it('successfully changes password', changePassword).timeout(40000)

  it.skip('successfully changes password when passcode is set', async function () {
    const passcode = 'passcode'
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        } else {
          values.push(CreateChallengeValue(prompt, context.password))
        }
      }
      return values
    }
    context.application.setLaunchCallback({
      receiveChallenge: (challenge) => {
        context.application.addChallengeObserver(challenge, {
          onInvalidValue: (value) => {
            const values = promptValueReply([value.prompt])
            context.application.submitValuesForChallenge(challenge, values)
            numPasscodeAttempts++
          },
        })
        const initialValues = promptValueReply(challenge.prompts)
        context.application.submitValuesForChallenge(challenge, initialValues)
      },
    })
    await context.application.setPasscode(passcode)
    await changePassword.bind(this)()
  }).timeout(20000)

  it('changes password many times', async function () {
    await context.application.register(context.email, context.password)

    const noteCount = 10
    await Factory.createManyMappedNotes(context.application, noteCount)
    this.expectedItemCount += noteCount
    await context.application.sync.sync(syncOptions)

    const numTimesToChangePw = 3
    let newPassword = Factory.randomString()
    let currentPassword = context.password

    for (let i = 0; i < numTimesToChangePw; i++) {
      await context.application.changePassword(currentPassword, newPassword)

      /** New items key */
      this.expectedItemCount++

      currentPassword = newPassword
      newPassword = Factory.randomString()

      expect(context.application.items.items.length).to.equal(this.expectedItemCount)
      expect(context.application.payloads.invalidPayloads.length).to.equal(0)

      await context.application.sync.markAllItemsAsNeedingSyncAndPersist()
      await context.application.sync.sync(syncOptions)

      context.application = await this.context.signout()

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
    context.application = await Factory.signOutApplicationAndReturnNew(context.application)
    const performSignIn = sinon.spy(context.application.sessions, 'performSignIn')
    await context.application.signIn(context.email, 'wrong password', undefined, undefined, undefined, true)
    expect(performSignIn.callCount).to.equal(1)
  })

  it('should rollback password change if fails to sync new items key', async function () {
    /** Should delete the new items key locally without marking it as deleted so that it doesn't sync */
    await this.context.register()

    const originalImpl = context.application.encryption.getSureDefaultItemsKey
    context.application.encryption.getSureDefaultItemsKey = () => {
      return {
        neverSynced: true,
      }
    }

    const mutatorSpy = sinon.spy(context.application.mutator, 'setItemToBeDeleted')
    const removeItemsSpy = sinon.spy(context.application.items, 'removeItemsFromMemory')
    const deletePayloadsSpy = sinon.spy(context.application.storage, 'deletePayloadsWithUuids')

    await this.context.changePassword('new-password')

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
    it('should prompt for account password when deleting account', async function () {
      Factory.handlePasswordChallenges(context.application, context.password)

      const sendChallengeSpy = sinon.spy(context.application.challenges, 'sendChallenge')

      await context.application.user.deleteAccount()

      expect(sendChallengeSpy.callCount).to.equal(1)
    }).timeout(Factory.TenSecondTimeout)

    it('deleting account should sign out current user', async function () {
      const context = await Factory.createAppContextWithRealCrypto()

      await context.launch()
      await context.register()

      Factory.handlePasswordChallenges(context.application, context.password)

      const signOutSpy = sinon.spy(context.application.user.sessions, 'signOut')

      await context.application.user.deleteAccount()

      expect(context.application.dealloced).to.be.true
      expect(signOutSpy.callCount).to.equal(1)
    }).timeout(Factory.TenSecondTimeout)
  })
})
