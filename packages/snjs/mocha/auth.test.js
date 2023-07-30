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

  beforeEach(async function () {
    localStorage.clear()
    this.expectedItemCount = BaseItemCounts.DefaultItemsWithAccount
    this.context = await Factory.createAppContext()
    await this.context.launch()
    this.application = this.context.application
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    localStorage.clear()
  })

  it('successfully register new account', async function () {
    const response = await this.application.register(this.email, this.password)
    expect(response).to.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok
  })

  it('fails register new account with short password', async function () {
    const password = '123456'

    let error = null
    try {
      await this.application.register(this.email, password)
    } catch (caughtError) {
      error = caughtError
    }

    expect(error.message).to.equal(
      'Your password must be at least 8 characters in length. ' +
        'For your security, please choose a longer password or, ideally, a passphrase, and try again.',
    )

    expect(await this.application.encryption.getRootKey()).to.not.be.ok
  })

  it('successfully signs out of account', async function () {
    await this.application.register(this.email, this.password)

    expect(await this.application.encryption.getRootKey()).to.be.ok

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    expect(await this.application.encryption.getRootKey()).to.not.be.ok
    expect(this.application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyNone)
  })

  it('successfully signs in to registered account', async function () {
    await this.application.register(this.email, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const response = await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot sign while already signed in', async function () {
    await this.application.register(this.email, this.password)
    await Factory.createSyncedNote(this.application)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const response = await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok

    let error
    try {
      await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
  }).timeout(20000)

  it('cannot register while already signed in', async function () {
    await this.application.register(this.email, this.password)
    let error
    try {
      await this.application.register(this.email, this.password)
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('cannot perform two sign-ins at the same time', async function () {
    await this.application.register(this.email, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    await Promise.all([
      (async () => {
        const response = await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
        expect(response).to.be.ok
        expect(response.data.error).to.not.be.ok
        expect(await this.application.encryption.getRootKey()).to.be.ok
      })(),
      (async () => {
        /** Make sure the first function runs first */
        await new Promise((resolve) => setTimeout(resolve))
        /** Try to sign in while the first request is going */
        let error
        try {
          await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
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
        const response = await this.application.register(this.email, this.password)
        expect(response).to.be.ok
        expect(response.error).to.not.be.ok
        expect(await this.application.encryption.getRootKey()).to.be.ok
      })(),
      (async () => {
        /** Make sure the first function runs first */
        await new Promise((resolve) => setTimeout(resolve))
        /** Try to register in while the first request is going */
        let error
        try {
          await this.application.register(this.email, this.password)
        } catch (e) {
          error = e
        }
        expect(error).to.be.ok
      })(),
    ])
  }).timeout(20000)

  it('successfuly signs in after failing once', async function () {
    await this.application.register(this.email, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    let response = await this.application.signIn(this.email, 'wrong password', undefined, undefined, undefined, true)
    expect(response).to.have.property('status', 401)
    expect(response.data.error).to.be.ok

    response = await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)

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
    await this.application.register(uppercase, this.password)

    const response = await this.application.sessions.retrieveKeyParams(lowercase)
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
    await this.application.register(lowercase, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const response = await this.application.signIn(uppercase, this.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('can sign into account regardless of whitespace', async function () {
    const rand = `${Math.random()}`
    const withspace = `FOO@BAR.COM${rand}   `
    const nospace = `foo@bar.com${rand}`
    /**
     * Registering with a lowercase email should allow us to sign in
     * with an uppercase email
     */
    await this.application.register(nospace, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const response = await this.application.signIn(withspace, this.password, undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.not.be.ok
    expect(await this.application.encryption.getRootKey()).to.be.ok
  }).timeout(20000)

  it('fails login with wrong password', async function () {
    await this.application.register(this.email, this.password)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const response = await this.application.signIn(this.email, 'wrongpassword', undefined, undefined, undefined, true)
    expect(response).to.be.ok
    expect(response.data.error).to.be.ok
    expect(await this.application.encryption.getRootKey()).to.not.be.ok
  }).timeout(20000)

  it('fails to change to short password', async function () {
    await this.application.register(this.email, this.password)
    const newPassword = '123456'
    const response = await this.application.changePassword(this.password, newPassword)
    expect(response.error).to.be.ok
  }).timeout(20000)

  it('fails to change password when current password is incorrect', async function () {
    await this.application.register(this.email, this.password)
    const response = await this.application.changePassword('Invalid password', 'New password')
    expect(response.error).to.be.ok

    /** Ensure we can still log in */
    this.application = await Factory.signOutAndBackIn(this.application, this.email, this.password)
  }).timeout(20000)

  it('registering for new account and completing first after download sync should not put us out of sync', async function () {
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()

    let outOfSync = true
    let didCompletePostDownloadFirstSync = false
    let didCompleteDownloadFirstSync = false
    this.application.sync.addEventObserver((eventName) => {
      if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
        didCompleteDownloadFirstSync = true
      }
      if (!didCompleteDownloadFirstSync) {
        return
      }
      if (!didCompletePostDownloadFirstSync && eventName === SyncEvent.PaginatedSyncRequestCompleted) {
        didCompletePostDownloadFirstSync = true
        /** Should be in sync */
        outOfSync = this.application.sync.isOutOfSync()
      }
    })

    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    expect(didCompleteDownloadFirstSync).to.equal(true)
    expect(didCompletePostDownloadFirstSync).to.equal(true)
    expect(outOfSync).to.equal(false)
  })

  async function changePassword() {
    await this.application.register(this.email, this.password)

    const noteCount = 10

    await Factory.createManyMappedNotes(this.application, noteCount)

    this.expectedItemCount += noteCount

    await this.application.sync.sync(syncOptions)

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    const newPassword = 'newpassword'
    const response = await this.application.changePassword(this.password, newPassword)

    /** New items key */
    this.expectedItemCount++

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    expect(response.error).to.not.be.ok
    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
    expect(this.application.payloads.invalidPayloads.length).to.equal(0)

    await this.application.sync.markAllItemsAsNeedingSyncAndPersist()
    await this.application.sync.sync(syncOptions)

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)

    const note = this.application.items.getDisplayableNotes()[0]

    /**
     * Create conflict for a note. First modify the item without saving so that
     * our local contents digress from the server's
     */
    await this.application.mutator.changeItem(note, (mutator) => {
      mutator.title = `${Math.random()}`
    })

    await Factory.changePayloadTimeStampAndSync(
      this.application,
      note.payload,
      Factory.dateToMicroseconds(Factory.yesterday()),
      {
        title: `${Math.random()}`,
      },
      syncOptions,
    )
    this.expectedItemCount++

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)

    /** Should login with new password */
    const signinResponse = await this.application.signIn(this.email, newPassword, undefined, undefined, undefined, true)

    expect(signinResponse).to.be.ok
    expect(signinResponse.data.error).to.not.be.ok

    expect(await this.application.encryption.getRootKey()).to.be.ok

    expect(this.application.items.items.length).to.equal(this.expectedItemCount)
    expect(this.application.payloads.invalidPayloads.length).to.equal(0)
  }

  it('successfully changes password', changePassword).timeout(40000)

  it('successfully changes password when passcode is set', async function () {
    const passcode = 'passcode'
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        } else {
          values.push(CreateChallengeValue(prompt, this.password))
        }
      }
      return values
    }
    this.application.setLaunchCallback({
      receiveChallenge: (challenge) => {
        this.application.addChallengeObserver(challenge, {
          onInvalidValue: (value) => {
            const values = promptValueReply([value.prompt])
            this.application.submitValuesForChallenge(challenge, values)
            numPasscodeAttempts++
          },
        })
        const initialValues = promptValueReply(challenge.prompts)
        this.application.submitValuesForChallenge(challenge, initialValues)
      },
    })
    await this.application.addPasscode(passcode)
    await changePassword.bind(this)()
  }).timeout(20000)

  it('changes password many times', async function () {
    await this.application.register(this.email, this.password)

    const noteCount = 10
    await Factory.createManyMappedNotes(this.application, noteCount)
    this.expectedItemCount += noteCount
    await this.application.sync.sync(syncOptions)

    const numTimesToChangePw = 3
    let newPassword = Factory.randomString()
    let currentPassword = this.password

    for (let i = 0; i < numTimesToChangePw; i++) {
      await this.application.changePassword(currentPassword, newPassword)

      /** New items key */
      this.expectedItemCount++

      currentPassword = newPassword
      newPassword = Factory.randomString()

      expect(this.application.items.items.length).to.equal(this.expectedItemCount)
      expect(this.application.payloads.invalidPayloads.length).to.equal(0)

      await this.application.sync.markAllItemsAsNeedingSyncAndPersist()
      await this.application.sync.sync(syncOptions)

      this.application = await this.context.signout()

      expect(this.application.items.items.length).to.equal(BaseItemCounts.DefaultItems)
      expect(this.application.payloads.invalidPayloads.length).to.equal(0)

      /** Should login with new password */
      const signinResponse = await this.application.signIn(
        this.email,
        currentPassword,
        undefined,
        undefined,
        undefined,
        true,
      )

      expect(signinResponse).to.be.ok
      expect(signinResponse.data.error).to.not.be.ok
      expect(await this.application.encryption.getRootKey()).to.be.ok
    }
  }).timeout(80000)

  it('signing in with a clean email string should only try once', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const performSignIn = sinon.spy(this.application.sessions, 'performSignIn')
    await this.application.signIn(this.email, 'wrong password', undefined, undefined, undefined, true)
    expect(performSignIn.callCount).to.equal(1)
  })

  it('should rollback password change if fails to sync new items key', async function () {
    /** Should delete the new items key locally without marking it as deleted so that it doesn't sync */
    await this.context.register()

    const originalImpl = this.application.encryption.getSureDefaultItemsKey
    this.application.encryption.getSureDefaultItemsKey = () => {
      return {
        neverSynced: true,
      }
    }

    const mutatorSpy = sinon.spy(this.application.mutator, 'setItemToBeDeleted')
    const removeItemsSpy = sinon.spy(this.application.items, 'removeItemsFromMemory')
    const deletePayloadsSpy = sinon.spy(this.application.storage, 'deletePayloadsWithUuids')

    await this.context.changePassword('new-password')

    this.application.encryption.getSureDefaultItemsKey = originalImpl

    expect(mutatorSpy.callCount).to.equal(0)
    expect(removeItemsSpy.callCount).to.equal(1)
    expect(deletePayloadsSpy.callCount).to.equal(1)
  })

  describe('add passcode', function () {
    it('should set passcode successfully', async function () {
      const passcode = 'passcode'
      const result = await this.application.addPasscode(passcode)
      expect(result).to.be.true
    })

    it('should fail when attempting to set 0 character passcode', async function () {
      const passcode = ''
      const result = await this.application.addPasscode(passcode)
      expect(result).to.be.false
    })
  })

  describe('change passcode', function () {
    it('should change passcode successfully', async function () {
      const passcode = 'passcode'
      const newPasscode = 'newPasscode'
      await this.application.addPasscode(passcode)
      Factory.handlePasswordChallenges(this.application, passcode)
      const result = await this.application.changePasscode(newPasscode)
      expect(result).to.be.true
    }).timeout(Factory.TenSecondTimeout)

    it('should fail when attempting to change to a 0 character passcode', async function () {
      const passcode = 'passcode'
      const newPasscode = ''
      await this.application.addPasscode(passcode)
      Factory.handlePasswordChallenges(this.application, passcode)
      const result = await this.application.changePasscode(newPasscode)
      expect(result).to.be.false
    }).timeout(Factory.TenSecondTimeout)
  })

  describe('account deletion', function () {
    it('should delete account', async function () {
      await Factory.registerUserToApplication({
        application: this.application,
        email: this.email,
        password: this.password,
      })

      Factory.handlePasswordChallenges(this.application, this.password)
      await this.application.user.deleteAccount()
    }).timeout(Factory.TenSecondTimeout)

    it('should prompt for account password when deleting account', async function () {
      await Factory.registerUserToApplication({
        application: this.application,
        email: this.email,
        password: this.password,
      })

      Factory.handlePasswordChallenges(this.application, this.password)
      sinon.spy(this.application.challenges, 'sendChallenge')

      await this.application.user.deleteAccount()

      const spyCall = this.application.challenges.sendChallenge.getCall(0)
      const challenge = spyCall.firstArg
      expect(challenge.prompts).to.have.lengthOf(2)
      expect(challenge.prompts[0].validation).to.equal(ChallengeValidation.AccountPassword)
    }).timeout(Factory.TenSecondTimeout)

    it.skip('deleting account should sign out current user', async function () {
      /** Currently failing due to server error: 'Payments server is not available.' */
      await Factory.registerUserToApplication({
        application: this.application,
        email: this.email,
        password: this.password,
      })

      Factory.handlePasswordChallenges(this.application, this.password)

      const result = await this.application.user.deleteAccount()
      expect(result.error).to.equal(false)

      expect(this.application.hasAccount()).to.be.false
    }).timeout(Factory.TenSecondTimeout)
  })
})
