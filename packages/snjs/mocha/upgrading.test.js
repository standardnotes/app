import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('upgrading', () => {
  let application
  let context
  let email
  let password
  let passcode
  let receiveChallenge
  let receiveChallengeWithApp

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContext()
    await context.launch()

    application = context.application
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
    passcode = '1234'

    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        } else {
          values.push(CreateChallengeValue(prompt, password))
        }
      }
      return values
    }

    receiveChallenge = (challenge) => {
      void receiveChallengeWithApp(application, challenge)
    }

    receiveChallengeWithApp = (application, challenge) => {
      application.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          application.submitValuesForChallenge(challenge, values)
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  it('upgrade should be available when account only', async function () {
    const oldVersion = ProtocolVersion.V003
    /** Register with 003 version */
    await Factory.registerOldUser({
      application: application,
      email: email,
      password: password,
      version: oldVersion,
    })

    expect(await application.protocolUpgradeAvailable()).to.equal(true)
  })

  it('upgrade should be available when passcode only', async function () {
    const oldVersion = ProtocolVersion.V003
    await Factory.setOldVersionPasscode({
      application: application,
      passcode: passcode,
      version: oldVersion,
    })

    expect(await application.protocolUpgradeAvailable()).to.equal(true)
  })

  it('upgrades application protocol from 003 to 004', async function () {
    const oldVersion = ProtocolVersion.V003
    const newVersion = ProtocolVersion.V004

    await Factory.createMappedNote(application)

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: application,
      email: email,
      password: password,
      version: oldVersion,
    })

    await Factory.setOldVersionPasscode({
      application: application,
      passcode: passcode,
      version: oldVersion,
    })

    expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(oldVersion)
    expect((await application.encryption.getRootKeyParams()).version).to.equal(oldVersion)
    expect((await application.encryption.getRootKey()).keyVersion).to.equal(oldVersion)

    application.setLaunchCallback({
      receiveChallenge: receiveChallenge,
    })
    const result = await application.upgradeProtocolVersion()
    expect(result).to.deep.equal({ success: true })

    const wrappedRootKey = await application.encryption.rootKeyManager.getWrappedRootKey()
    const payload = new EncryptedPayload(wrappedRootKey)
    expect(payload.version).to.equal(newVersion)

    expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(newVersion)
    expect((await application.encryption.getRootKeyParams()).version).to.equal(newVersion)
    expect((await application.encryption.getRootKey()).keyVersion).to.equal(newVersion)

    /**
     * Immediately logging out ensures we don't rely on subsequent
     * sync events to complete the upgrade
     */
    application = await Factory.signOutApplicationAndReturnNew(application)
    await application.signIn(email, password, undefined, undefined, undefined, true)
    expect(application.items.getDisplayableNotes().length).to.equal(1)
    expect(application.payloads.invalidPayloads).to.be.empty
  }).timeout(15000)

  it('upgrading from 003 to 004 with passcode only then reiniting app should create valid state', async function () {
    /**
     * There was an issue where having the old app set up with passcode,
     * then refreshing with new app, performing upgrade, then refreshing the app
     * resulted in note data being errored.
     */
    const oldVersion = ProtocolVersion.V003

    await Factory.setOldVersionPasscode({
      application: application,
      passcode: passcode,
      version: oldVersion,
    })
    await Factory.createSyncedNote(application)

    application.setLaunchCallback({
      receiveChallenge: receiveChallenge,
    })

    const identifier = application.identifier

    /** Recreate the app once */
    const appFirst = Factory.createApplicationWithFakeCrypto(identifier)
    await appFirst.prepareForLaunch({
      receiveChallenge: (challenge) => {
        receiveChallengeWithApp(appFirst, challenge)
      },
    })
    await appFirst.launch(true)
    const result = await appFirst.upgradeProtocolVersion()
    expect(result).to.deep.equal({ success: true })
    expect(appFirst.payloads.invalidPayloads).to.be.empty
    await Factory.safeDeinit(appFirst)

    /** Recreate the once more */
    const appSecond = Factory.createApplicationWithFakeCrypto(identifier)
    await appSecond.prepareForLaunch({
      receiveChallenge: (challenge) => {
        receiveChallengeWithApp(appSecond, challenge)
      },
    })
    await appSecond.launch(true)
    expect(appSecond.payloads.invalidPayloads).to.be.empty
    await Factory.safeDeinit(appSecond)
  }).timeout(15000)

  it('protocol version should be upgraded on password change', async function () {
    /** Delete default items key that is created on launch */
    const itemsKey = await application.encryption.getSureDefaultItemsKey()
    await application.mutator.setItemToBeDeleted(itemsKey)
    expect(Uuids(application.items.getDisplayableItemsKeys()).includes(itemsKey.uuid)).to.equal(false)

    Factory.createMappedNote(application)

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: application,
      email: email,
      password: password,
      version: ProtocolVersion.V003,
    })

    expect(application.items.getDisplayableItemsKeys().length).to.equal(1)

    expect((await application.encryption.getRootKeyParams()).version).to.equal(ProtocolVersion.V003)
    expect((await application.encryption.getRootKey()).keyVersion).to.equal(ProtocolVersion.V003)

    /** Ensure note is encrypted with 003 */
    const notePayloads = await Factory.getStoragePayloadsOfType(application, ContentType.TYPES.Note)
    expect(notePayloads.length).to.equal(1)
    expect(notePayloads[0].version).to.equal(ProtocolVersion.V003)

    const { error } = await application.changePassword(password, 'foobarfoo')
    expect(error).to.not.exist

    const latestVersion = application.encryption.getLatestVersion()
    expect((await application.encryption.getRootKeyParams()).version).to.equal(latestVersion)
    expect((await application.encryption.getRootKey()).keyVersion).to.equal(latestVersion)

    const defaultItemsKey = await application.encryption.getSureDefaultItemsKey()
    expect(defaultItemsKey.keyVersion).to.equal(latestVersion)

    /** After change, note should now be encrypted with latest protocol version */

    const note = application.items.getDisplayableNotes()[0]
    await Factory.markDirtyAndSyncItem(application, note)

    const refreshedNotePayloads = await Factory.getStoragePayloadsOfType(application, ContentType.TYPES.Note)
    const refreshedNotePayload = refreshedNotePayloads[0]
    expect(refreshedNotePayload.version).to.equal(latestVersion)
  }).timeout(5000)

  describe('upgrade failure', function () {
    this.timeout(30000)
    const oldVersion = ProtocolVersion.V003

    beforeEach(async function () {
      await Factory.createMappedNote(application)

      /** Register with 003 version */
      await Factory.registerOldUser({
        application: application,
        email: email,
        password: password,
        version: oldVersion,
      })

      await Factory.setOldVersionPasscode({
        application: application,
        passcode: passcode,
        version: oldVersion,
      })
    })

    afterEach(function () {
      sinon.restore()
    })

    it('rolls back the local protocol upgrade if syncing fails', async function () {
      sinon.replace(application.sync, 'sync', sinon.fake())
      application.setLaunchCallback({
        receiveChallenge: receiveChallenge,
      })
      expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(oldVersion)
      const errors = await application.upgradeProtocolVersion()
      expect(errors).to.not.be.empty

      /** Ensure we're still on 003 */
      expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(oldVersion)
      expect((await application.encryption.getRootKeyParams()).version).to.equal(oldVersion)
      expect((await application.encryption.getRootKey()).keyVersion).to.equal(oldVersion)
      expect((await application.encryption.getSureDefaultItemsKey()).keyVersion).to.equal(oldVersion)
    })

    it('rolls back the local protocol upgrade if the server responds with an error', async function () {
      sinon.replace(application.sessions, 'changeCredentials', () => [Error()])

      application.setLaunchCallback({
        receiveChallenge: receiveChallenge,
      })
      expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(oldVersion)
      const errors = await application.upgradeProtocolVersion()
      expect(errors).to.not.be.empty

      /** Ensure we're still on 003 */
      expect((await application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()).version).to.equal(oldVersion)
      expect((await application.encryption.getRootKeyParams()).version).to.equal(oldVersion)
      expect((await application.encryption.getRootKey()).keyVersion).to.equal(oldVersion)
      expect((await application.encryption.getSureDefaultItemsKey()).keyVersion).to.equal(oldVersion)
    })
  })
})
