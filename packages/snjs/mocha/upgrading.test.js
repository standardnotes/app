/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('upgrading', () => {
  beforeEach(async function () {
    localStorage.clear()
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
    this.passcode = '1234'

    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, this.passcode))
        } else {
          values.push(CreateChallengeValue(prompt, this.password))
        }
      }
      return values
    }
    this.receiveChallenge = (challenge) => {
      void this.receiveChallengeWithApp(this.application, challenge)
    }
    this.receiveChallengeWithApp = (application, challenge) => {
      application.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          application.submitValuesForChallenge(challenge, values)
          numPasscodeAttempts++
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    localStorage.clear()
  })

  it('upgrade should be available when account only', async function () {
    const oldVersion = ProtocolVersion.V003
    /** Register with 003 version */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: oldVersion,
    })

    expect(await this.application.protocolUpgradeAvailable()).to.equal(true)
  })

  it('upgrade should be available when passcode only', async function () {
    const oldVersion = ProtocolVersion.V003
    await Factory.setOldVersionPasscode({
      application: this.application,
      passcode: this.passcode,
      version: oldVersion,
    })

    expect(await this.application.protocolUpgradeAvailable()).to.equal(true)
  })

  it('upgrades application protocol from 003 to 004', async function () {
    const oldVersion = ProtocolVersion.V003
    const newVersion = ProtocolVersion.V004

    await Factory.createMappedNote(this.application)

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: oldVersion,
    })

    await Factory.setOldVersionPasscode({
      application: this.application,
      passcode: this.passcode,
      version: oldVersion,
    })

    expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
      oldVersion,
    )
    expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(oldVersion)
    expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(oldVersion)

    this.application.setLaunchCallback({
      receiveChallenge: this.receiveChallenge,
    })
    const result = await this.application.upgradeProtocolVersion()
    expect(result).to.deep.equal({ success: true })

    const wrappedRootKey = await this.application.protocolService.rootKeyEncryption.getWrappedRootKey()
    const payload = new EncryptedPayload(wrappedRootKey)
    expect(payload.version).to.equal(newVersion)

    expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
      newVersion,
    )
    expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(newVersion)
    expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(newVersion)

    /**
     * Immediately logging out ensures we don't rely on subsequent
     * sync events to complete the upgrade
     */
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)
    expect(this.application.itemManager.getDisplayableNotes().length).to.equal(1)
    expect(this.application.payloadManager.invalidPayloads).to.be.empty
  }).timeout(15000)

  it('upgrading from 003 to 004 with passcode only then reiniting app should create valid state', async function () {
    /**
     * There was an issue where having the old app set up with passcode,
     * then refreshing with new app, performing upgrade, then refreshing the app
     * resulted in note data being errored.
     */
    const oldVersion = ProtocolVersion.V003

    await Factory.setOldVersionPasscode({
      application: this.application,
      passcode: this.passcode,
      version: oldVersion,
    })
    await Factory.createSyncedNote(this.application)

    this.application.setLaunchCallback({
      receiveChallenge: this.receiveChallenge,
    })

    const identifier = this.application.identifier

    /** Recreate the app once */
    const appFirst = Factory.createApplicationWithFakeCrypto(identifier)
    await appFirst.prepareForLaunch({
      receiveChallenge: (challenge) => {
        this.receiveChallengeWithApp(appFirst, challenge)
      },
    })
    await appFirst.launch(true)
    const result = await appFirst.upgradeProtocolVersion()
    expect(result).to.deep.equal({ success: true })
    expect(appFirst.payloadManager.invalidPayloads).to.be.empty
    await Factory.safeDeinit(appFirst)

    /** Recreate the once more */
    const appSecond = Factory.createApplicationWithFakeCrypto(identifier)
    await appSecond.prepareForLaunch({
      receiveChallenge: (challenge) => {
        this.receiveChallengeWithApp(appSecond, challenge)
      },
    })
    await appSecond.launch(true)
    expect(appSecond.payloadManager.invalidPayloads).to.be.empty
    await Factory.safeDeinit(appSecond)
  }).timeout(15000)

  it('protocol version should be upgraded on password change', async function () {
    /** Delete default items key that is created on launch */
    const itemsKey = await this.application.protocolService.getSureDefaultItemsKey()
    await this.application.itemManager.setItemToBeDeleted(itemsKey)
    expect(this.application.itemManager.getDisplayableItemsKeys().length).to.equal(0)

    Factory.createMappedNote(this.application)

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: ProtocolVersion.V003,
    })

    expect(this.application.itemManager.getDisplayableItemsKeys().length).to.equal(1)

    expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(ProtocolVersion.V003)
    expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(ProtocolVersion.V003)

    /** Ensure note is encrypted with 003 */
    const notePayloads = await Factory.getStoragePayloadsOfType(this.application, ContentType.Note)
    expect(notePayloads.length).to.equal(1)
    expect(notePayloads[0].version).to.equal(ProtocolVersion.V003)

    const { error } = await this.application.changePassword(this.password, 'foobarfoo')
    expect(error).to.not.exist

    const latestVersion = this.application.protocolService.getLatestVersion()
    expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(latestVersion)
    expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(latestVersion)

    const defaultItemsKey = await this.application.protocolService.getSureDefaultItemsKey()
    expect(defaultItemsKey.keyVersion).to.equal(latestVersion)

    /** After change, note should now be encrypted with latest protocol version */

    const note = this.application.itemManager.getDisplayableNotes()[0]
    await Factory.markDirtyAndSyncItem(this.application, note)

    const refreshedNotePayloads = await Factory.getStoragePayloadsOfType(this.application, ContentType.Note)
    const refreshedNotePayload = refreshedNotePayloads[0]
    expect(refreshedNotePayload.version).to.equal(latestVersion)
  }).timeout(5000)

  describe('upgrade failure', function () {
    this.timeout(30000)
    const oldVersion = ProtocolVersion.V003

    beforeEach(async function () {
      await Factory.createMappedNote(this.application)

      /** Register with 003 version */
      await Factory.registerOldUser({
        application: this.application,
        email: this.email,
        password: this.password,
        version: oldVersion,
      })

      await Factory.setOldVersionPasscode({
        application: this.application,
        passcode: this.passcode,
        version: oldVersion,
      })
    })

    afterEach(function () {
      sinon.restore()
    })

    it('rolls back the local protocol upgrade if syncing fails', async function () {
      sinon.replace(this.application.syncService, 'sync', sinon.fake())
      this.application.setLaunchCallback({
        receiveChallenge: this.receiveChallenge,
      })
      expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
        oldVersion,
      )
      const errors = await this.application.upgradeProtocolVersion()
      expect(errors).to.not.be.empty

      /** Ensure we're still on 003 */
      expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
        oldVersion,
      )
      expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(oldVersion)
      expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(oldVersion)
      expect((await this.application.protocolService.getSureDefaultItemsKey()).keyVersion).to.equal(oldVersion)
    })

    it('rolls back the local protocol upgrade if the server responds with an error', async function () {
      sinon.replace(this.application.sessionManager, 'changeCredentials', () => [Error()])

      this.application.setLaunchCallback({
        receiveChallenge: this.receiveChallenge,
      })
      expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
        oldVersion,
      )
      const errors = await this.application.upgradeProtocolVersion()
      expect(errors).to.not.be.empty

      /** Ensure we're still on 003 */
      expect((await this.application.protocolService.rootKeyEncryption.getRootKeyWrapperKeyParams()).version).to.equal(
        oldVersion,
      )
      expect((await this.application.protocolService.getRootKeyParams()).version).to.equal(oldVersion)
      expect((await this.application.protocolService.getRootKey()).keyVersion).to.equal(oldVersion)
      expect((await this.application.protocolService.getSureDefaultItemsKey()).keyVersion).to.equal(oldVersion)
    })
  })
})
