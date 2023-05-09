/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { BaseItemCounts } from './lib/Applications.js'
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('storage manager', function () {
  this.timeout(Factory.TenSecondTimeout)
  /**
   * Items are saved in localStorage in tests.
   * Base keys are `storage`, `snjs_version`, and `keychain`
   */
  const BASE_KEY_COUNT = 3

  beforeEach(async function () {
    localStorage.clear()
    this.expectedKeyCount = BASE_KEY_COUNT
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

  it('should set and retrieve values', async function () {
    const key = 'foo'
    const value = 'bar'
    await this.application.diskStorageService.setValue(key, value)
    expect(await this.application.diskStorageService.getValue(key)).to.eql(value)
  })

  it('should set and retrieve items', async function () {
    const payload = Factory.createNotePayload()
    await this.application.diskStorageService.savePayload(payload)
    const payloads = await this.application.diskStorageService.getAllRawPayloads()
    expect(payloads.length).to.equal(BaseItemCounts.DefaultItems + 1)
  })

  it('should clear values', async function () {
    const key = 'foo'
    const value = 'bar'
    await this.application.diskStorageService.setValue(key, value)
    await this.application.diskStorageService.clearAllData()
    expect(await this.application.diskStorageService.getValue(key)).to.not.be.ok
  })

  it('serverPassword should not be saved to keychain', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: false,
    })
    const keychainValue = await this.application.deviceInterface.getNamespacedKeychainValue(this.application.identifier)
    expect(keychainValue.masterKey).to.be.ok
    expect(keychainValue.serverPassword).to.not.be.ok
  })

  it.skip('regular session should persist data', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: false,
    })
    const key = 'foo'
    const value = 'bar'
    await this.application.diskStorageService.setValue(key, value)
    /** Items are stored in local storage */
    expect(Object.keys(localStorage).length).to.equal(this.expectedKeyCount + BaseItemCounts.DefaultItems)
    const retrievedValue = await this.application.diskStorageService.getValue(key)
    expect(retrievedValue).to.equal(value)
  })

  it('ephemeral session should not persist data', async function () {
    this.retries(2)
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: true,
    })
    const key = 'foo'
    const value = 'bar'
    await this.application.diskStorageService.setValueAndAwaitPersist(key, value)
    expect(Object.keys(localStorage).length).to.equal(0)
    const retrievedValue = await this.application.diskStorageService.getValue(key)
    expect(retrievedValue).to.equal(value)
  })

  it('ephemeral session should not persist to database', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: true,
    })
    await Factory.createSyncedNote(this.application)
    const rawPayloads = await this.application.diskStorageService.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(0)
  })

  it('storage with no account and no passcode should not be encrypted', async function () {
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    const wrappedValue = this.application.diskStorageService.values[ValueModesKeys.Wrapped]
    const payload = new DecryptedPayload(wrappedValue)
    expect(payload.content).to.be.an.instanceof(Object)
  })

  it('storage aftering adding passcode should be encrypted', async function () {
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    await this.application.addPasscode('123')
    const wrappedValue = this.application.diskStorageService.values[ValueModesKeys.Wrapped]
    const payload = new EncryptedPayload(wrappedValue)
    expect(payload.content).to.be.a('string')
  })

  it('storage after adding passcode then removing passcode should not be encrypted', async function () {
    const passcode = '123'
    Factory.handlePasswordChallenges(this.application, passcode)
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    await this.application.addPasscode(passcode)
    await this.application.diskStorageService.setValueAndAwaitPersist('bar', 'foo')
    await this.application.removePasscode()
    const wrappedValue = this.application.diskStorageService.values[ValueModesKeys.Wrapped]
    const payload = new DecryptedPayload(wrappedValue)
    expect(payload.content).to.be.an.instanceof(Object)
  })

  it('storage aftering adding passcode/removing passcode w/account should be encrypted', async function () {
    const passcode = '123'
    /**
     * After setting passcode, we expect that the keychain has been cleared, as the account keys
     * are now wrapped in storage with the passcode. Once the passcode is removed, we expect
     * the account keys to be moved to the keychain.
     * */
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    expect(await this.application.deviceInterface.getNamespacedKeychainValue(this.application.identifier)).to.be.ok
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    Factory.handlePasswordChallenges(this.application, this.password)
    await this.application.addPasscode(passcode)
    expect(await this.application.deviceInterface.getNamespacedKeychainValue(this.application.identifier)).to.not.be.ok
    await this.application.diskStorageService.setValueAndAwaitPersist('bar', 'foo')
    Factory.handlePasswordChallenges(this.application, passcode)
    await this.application.removePasscode()
    expect(await this.application.deviceInterface.getNamespacedKeychainValue(this.application.identifier)).to.be.ok

    const wrappedValue = this.application.diskStorageService.values[ValueModesKeys.Wrapped]
    const payload = new EncryptedPayload(wrappedValue)
    expect(payload.content).to.be.a('string')
  })

  it('adding account should encrypt storage with account keys', async function () {
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: true,
    })
    const accountKey = await this.application.protocolService.getRootKey()
    expect(await this.application.diskStorageService.canDecryptWithKey(accountKey)).to.equal(true)
  })

  it('signing out of account should decrypt storage', async function () {
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: true,
    })
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.diskStorageService.setValueAndAwaitPersist('bar', 'foo')
    const wrappedValue = this.application.diskStorageService.values[ValueModesKeys.Wrapped]
    const payload = new DecryptedPayload(wrappedValue)
    expect(payload.content).to.be.an.instanceof(Object)
  })

  it('adding account then passcode should encrypt storage with account keys', async function () {
    /** Should encrypt storage with account keys and encrypt account keys with passcode */
    await this.application.diskStorageService.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: true,
    })

    /** Should not be wrapped root key yet */
    expect(await this.application.protocolService.rootKeyEncryption.getWrappedRootKey()).to.not.be.ok

    const passcode = '123'
    Factory.handlePasswordChallenges(this.application, this.password)
    await this.application.addPasscode(passcode)
    await this.application.diskStorageService.setValueAndAwaitPersist('bar', 'foo')

    /** Root key should now be wrapped */
    expect(await this.application.protocolService.rootKeyEncryption.getWrappedRootKey()).to.be.ok

    const accountKey = await this.application.protocolService.getRootKey()
    expect(await this.application.diskStorageService.canDecryptWithKey(accountKey)).to.equal(true)
    const passcodeKey = await this.application.protocolService.computeWrappingKey(passcode)
    const wrappedRootKey = await this.application.protocolService.rootKeyEncryption.getWrappedRootKey()
    /** Expect that we can decrypt wrapped root key with passcode key */
    const payload = new EncryptedPayload(wrappedRootKey)
    const decrypted = await this.application.protocolService.decryptSplitSingle({
      usesRootKey: {
        items: [payload],
        key: passcodeKey,
      },
    })
    expect(decrypted.content).to.be.an.instanceof(Object)
  })

  it('stored payloads should not contain metadata fields', async function () {
    await this.application.addPasscode('123')
    await Factory.createSyncedNote(this.application)
    const payloads = await this.application.diskStorageService.getAllRawPayloads()
    const payload = payloads[0]
    expect(payload.fields).to.not.be.ok
    expect(payload.source).to.not.be.ok
    expect(payload.format).to.not.be.ok
  })

  it('storing an offline synced payload should not include dirty flag', async function () {
    await this.application.addPasscode('123')
    await Factory.createSyncedNote(this.application)
    const payloads = await this.application.diskStorageService.getAllRawPayloads()
    const payload = payloads[0]

    expect(payload.dirty).to.not.be.ok
  })

  it('storing an online synced payload should not include dirty flag', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: false,
    })

    await Factory.createSyncedNote(this.application)
    const payloads = await this.application.diskStorageService.getAllRawPayloads()
    const payload = payloads[0]

    expect(payload.dirty).to.not.be.ok
  })

  it('signing out should clear unwrapped value store', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: false,
    })

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    const values = this.application.diskStorageService.values[ValueModesKeys.Unwrapped]
    expect(Object.keys(values).length).to.equal(0)
  })

  it('signing out should clear payloads', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
      ephemeral: false,
    })

    await Factory.createSyncedNote(this.application)
    expect(await Factory.storagePayloadCount(this.application)).to.equal(BaseItemCounts.DefaultItems + 1)
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await Factory.sleep(0.1, 'Allow all untrackable singleton syncs to complete')
    expect(await Factory.storagePayloadCount(this.application)).to.equal(BaseItemCounts.DefaultItems)
  })
})
