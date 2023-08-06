import { BaseItemCounts } from './lib/BaseItemCounts.js'
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('storage manager', function () {
  this.timeout(Factory.TenSecondTimeout)

  /**
   * Items are saved in localStorage in tests.
   */
  const BASE_KEY_COUNT = ['storage', 'snjs_version', 'keychain'].length

  let application
  let email
  let password
  let expectedKeyCount

  beforeEach(async function () {
    localStorage.clear()
    expectedKeyCount = BASE_KEY_COUNT

    context = await Factory.createAppContext()
    await context.launch()

    application = context.application
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await context.deinit()

    application = undefined
    context = undefined

    localStorage.clear()
  })

  it('should set and retrieve values', async function () {
    const key = 'foo'
    const value = 'bar'
    await application.storage.setValue(key, value)
    expect(await application.storage.getValue(key)).to.eql(value)
  })

  it('should set and retrieve items', async function () {
    const payload = Factory.createNotePayload()
    await application.storage.savePayload(payload)
    const payloads = await application.storage.getAllRawPayloads()
    expect(payloads.length).to.equal(BaseItemCounts.DefaultItems + 1)
  })

  it('should clear values', async function () {
    const key = 'foo'
    const value = 'bar'
    await application.storage.setValue(key, value)
    await application.storage.clearAllData()
    expect(await application.storage.getValue(key)).to.not.be.ok
  })

  it('serverPassword should not be saved to keychain', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: false,
    })
    const keychainValue = await application.device.getNamespacedKeychainValue(application.identifier)
    expect(keychainValue.masterKey).to.be.ok
    expect(keychainValue.serverPassword).to.not.be.ok
  })

  it('regular session should persist data', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: false,
    })

    const key = 'foo'
    const value = 'bar'
    await application.storage.setValue(key, value)

    expect(Object.keys(localStorage).length).to.equal(expectedKeyCount + BaseItemCounts.DefaultItemsWithAccount)
    const retrievedValue = await application.storage.getValue(key)
    expect(retrievedValue).to.equal(value)
  })

  it('ephemeral session should not persist data', async function () {
    this.retries(2)
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })
    const key = 'foo'
    const value = 'bar'
    await application.storage.setValueAndAwaitPersist(key, value)

    const expectedKeys = ['keychain']
    expect(Object.keys(localStorage).length).to.equal(expectedKeys.length)

    const retrievedValue = await application.storage.getValue(key)
    expect(retrievedValue).to.equal(value)
  })

  it('ephemeral session should not persist to database', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })
    await Factory.createSyncedNote(application)
    const rawPayloads = await application.storage.getAllRawPayloads()
    expect(rawPayloads.length).to.equal(0)
  })

  it('storage with no account and no passcode should not be encrypted', async function () {
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    const wrappedValue = application.storage.values[ValueModesKeys.Wrapped]
    const payload = new DecryptedPayload(wrappedValue)
    expect(payload.content).to.be.an.instanceof(Object)
  })

  it('storage aftering adding passcode should be encrypted', async function () {
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    await application.addPasscode('123')
    const wrappedValue = application.storage.values[ValueModesKeys.Wrapped]
    const payload = new EncryptedPayload(wrappedValue)
    expect(payload.content).to.be.a('string')
  })

  it('storage after adding passcode then removing passcode should not be encrypted', async function () {
    const passcode = '123'
    Factory.handlePasswordChallenges(application, passcode)
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    await application.addPasscode(passcode)
    await application.storage.setValueAndAwaitPersist('bar', 'foo')
    await application.removePasscode()
    const wrappedValue = application.storage.values[ValueModesKeys.Wrapped]
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
      application: application,
      email: email,
      password: password,
    })
    expect(await application.device.getNamespacedKeychainValue(application.identifier)).to.be.ok
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    Factory.handlePasswordChallenges(application, password)
    await application.addPasscode(passcode)
    expect(await application.device.getNamespacedKeychainValue(application.identifier)).to.not.be.ok
    await application.storage.setValueAndAwaitPersist('bar', 'foo')
    Factory.handlePasswordChallenges(application, passcode)
    await application.removePasscode()
    expect(await application.device.getNamespacedKeychainValue(application.identifier)).to.be.ok

    const wrappedValue = application.storage.values[ValueModesKeys.Wrapped]
    const payload = new EncryptedPayload(wrappedValue)
    expect(payload.content).to.be.a('string')
  })

  it('adding account should encrypt storage with account keys', async function () {
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })
    const accountKey = await application.encryption.getRootKey()
    expect(await application.storage.canDecryptWithKey(accountKey)).to.equal(true)
  })

  it('signing out of account should decrypt storage', async function () {
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })

    application = await Factory.signOutApplicationAndReturnNew(application)

    await application.storage.setValueAndAwaitPersist('bar', 'foo')
    const wrappedValue = application.storage.values[ValueModesKeys.Wrapped]
    const payload = new DecryptedPayload(wrappedValue)

    expect(payload.content).to.be.an.instanceof(Object)

    await Factory.safeDeinit(application)
  })

  it('adding account then passcode should encrypt storage with account keys', async function () {
    /** Should encrypt storage with account keys and encrypt account keys with passcode */
    await application.storage.setValueAndAwaitPersist('foo', 'bar')
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: true,
    })

    /** Should not be wrapped root key yet */
    expect(await application.encryption.rootKeyManager.getWrappedRootKey()).to.not.be.ok

    const passcode = '123'
    Factory.handlePasswordChallenges(application, password)
    await application.addPasscode(passcode)
    await application.storage.setValueAndAwaitPersist('bar', 'foo')

    /** Root key should now be wrapped */
    expect(await application.encryption.rootKeyManager.getWrappedRootKey()).to.be.ok

    const accountKey = await application.encryption.getRootKey()
    expect(await application.storage.canDecryptWithKey(accountKey)).to.equal(true)
    const passcodeKey = await application.encryption.computeWrappingKey(passcode)
    const wrappedRootKey = await application.encryption.rootKeyManager.getWrappedRootKey()
    /** Expect that we can decrypt wrapped root key with passcode key */
    const payload = new EncryptedPayload(wrappedRootKey)
    const decrypted = await application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [payload],
        key: passcodeKey,
      },
    })
    expect(decrypted.content).to.be.an.instanceof(Object)
  })

  it('stored payloads should not contain metadata fields', async function () {
    await application.addPasscode('123')
    await Factory.createSyncedNote(application)
    const payloads = await application.storage.getAllRawPayloads()
    const payload = payloads[0]
    expect(payload.fields).to.not.be.ok
    expect(payload.source).to.not.be.ok
    expect(payload.format).to.not.be.ok
  })

  it('storing an offline synced payload should not include dirty flag', async function () {
    await application.addPasscode('123')
    await Factory.createSyncedNote(application)
    const payloads = await application.storage.getAllRawPayloads()
    const payload = payloads[0]

    expect(payload.dirty).to.not.be.ok
  })

  it('storing an online synced payload should not include dirty flag', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: false,
    })

    await Factory.createSyncedNote(application)
    const payloads = await application.storage.getAllRawPayloads()
    const payload = payloads[0]

    expect(payload.dirty).to.not.be.ok
  })

  it('signing out should clear unwrapped value store', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: false,
    })

    application = await Factory.signOutApplicationAndReturnNew(application)

    const values = application.storage.values[ValueModesKeys.Unwrapped]
    expect(Object.keys(values).length).to.equal(0)

    await Factory.safeDeinit(application)
  })

  it('signing out should clear payloads', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
      ephemeral: false,
    })

    await Factory.createSyncedNote(application)
    expect(await Factory.storagePayloadCount(application)).to.equal(BaseItemCounts.DefaultItemsWithAccount + 1)

    application = await Factory.signOutApplicationAndReturnNew(application)

    await Factory.sleep(0.1, 'Allow all untrackable singleton syncs to complete')
    expect(await Factory.storagePayloadCount(application)).to.equal(BaseItemCounts.DefaultItems)

    await Factory.safeDeinit(application)
  })
})
