import { BaseItemCounts } from './lib/BaseItemCounts.js'
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('backups', function () {
  let application
  let email
  let password

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
    email = UuidGenerator.GenerateUuid()
    password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = null
    localStorage.clear()
  })

  it('backup file should have a version number', async function () {
    let data = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(data.version).to.equal(application.encryption.getLatestVersion())
    await application.addPasscode('passcode')
    data = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(data.version).to.equal(application.encryption.getLatestVersion())
  })

  it('no passcode + no account backup file should have correct number of items', async function () {
    await Promise.all([Factory.createSyncedNote(application), Factory.createSyncedNote(application)])
    const data = (await application.createDecryptedBackupFile.execute()).getValue()
    const offsetForNewItems = 2
    const offsetForNoItemsKey = -1
    expect(data.items.length).to.equal(BaseItemCounts.DefaultItems + offsetForNewItems + offsetForNoItemsKey)
  })

  it('passcode + no account backup file should have correct number of items', async function () {
    const passcode = 'passcode'
    await application.addPasscode(passcode)
    await Promise.all([Factory.createSyncedNote(application), Factory.createSyncedNote(application)])

    // Encrypted backup without authorization
    const encryptedData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(encryptedData.items.length).to.equal(BaseItemCounts.DefaultItems + 2)

    // Encrypted backup with authorization
    Factory.handlePasswordChallenges(application, passcode)
    const authorizedEncryptedData = (await application.createEncryptedBackupFile.execute()).getValue()
    expect(authorizedEncryptedData.items.length).to.equal(BaseItemCounts.DefaultItems + 2)
  })

  it('no passcode + account backup file should have correct number of items', async function () {
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    await Promise.all([Factory.createSyncedNote(application), Factory.createSyncedNote(application)])

    // Encrypted backup without authorization
    const encryptedData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(encryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccount + 2)

    Factory.handlePasswordChallenges(application, password)

    // Decrypted backup
    const decryptedData = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(decryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccountWithoutItemsKey + 2)

    // Encrypted backup with authorization
    const authorizedEncryptedData = (await application.createEncryptedBackupFile.execute()).getValue()
    expect(authorizedEncryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccount + 2)
  })

  it('passcode + account backup file should have correct number of items', async function () {
    const passcode = 'passcode'
    await application.register(email, password)
    Factory.handlePasswordChallenges(application, password)
    await application.addPasscode(passcode)
    await Promise.all([Factory.createSyncedNote(application), Factory.createSyncedNote(application)])

    // Encrypted backup without authorization
    const encryptedData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(encryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccount + 2)

    Factory.handlePasswordChallenges(application, passcode)

    // Decrypted backup
    const decryptedData = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(decryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccountWithoutItemsKey + 2)

    // Encrypted backup with authorization
    const authorizedEncryptedData = (
      await application.createEncryptedBackupFile.execute({ skipAuthorization: true })
    ).getValue()
    expect(authorizedEncryptedData.items.length).to.equal(BaseItemCounts.DefaultItemsWithAccount + 2)
  }).timeout(10000)

  it('backup file item should have correct fields', async function () {
    await Factory.createSyncedNote(application)
    let backupData = (await application.createDecryptedBackupFile.execute()).getValue()
    let rawItem = backupData.items.find((i) => i.content_type === ContentType.TYPES.Note)

    expect(rawItem.fields).to.not.be.ok
    expect(rawItem.source).to.not.be.ok
    expect(rawItem.dirtyIndex).to.not.be.ok
    expect(rawItem.format).to.not.be.ok
    expect(rawItem.uuid).to.be.ok
    expect(rawItem.content_type).to.be.ok
    expect(rawItem.content).to.be.ok
    expect(rawItem.created_at).to.be.ok
    expect(rawItem.updated_at).to.be.ok

    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })

    backupData = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    rawItem = backupData.items.find((i) => i.content_type === ContentType.TYPES.Note)

    expect(rawItem.fields).to.not.be.ok
    expect(rawItem.source).to.not.be.ok
    expect(rawItem.dirtyIndex).to.not.be.ok
    expect(rawItem.format).to.not.be.ok
    expect(rawItem.uuid).to.be.ok
    expect(rawItem.content_type).to.be.ok
    expect(rawItem.content).to.be.ok
    expect(rawItem.created_at).to.be.ok
    expect(rawItem.updated_at).to.be.ok
  })

  it('downloading backup if item is error decrypting should succeed', async function () {
    await Factory.createSyncedNote(application)

    const note = await Factory.createSyncedNote(application)

    const encrypted = await application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })

    const errored = encrypted.copy({
      errorDecrypting: true,
    })

    await application.payloads.emitPayload(errored)

    const erroredItem = application.items.findAnyItem(errored.uuid)

    expect(erroredItem.errorDecrypting).to.equal(true)

    const backupData = (await application.createDecryptedBackupFile.execute()).getValue()

    expect(backupData.items.length).to.equal(BaseItemCounts.DefaultItemsNoAccounNoItemsKey + 2)
  })

  it('decrypted backup file should not have keyParams', async function () {
    const backup = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(backup).to.not.haveOwnProperty('keyParams')
  })

  it('decrypted backup file with account should not have keyParams', async function () {
    const application = await Factory.createInitAppWithFakeCrypto()
    const password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: application,
      email: UuidGenerator.GenerateUuid(),
      password: password,
    })

    Factory.handlePasswordChallenges(application, password)

    const backup = (await application.createDecryptedBackupFile.execute()).getValue()

    expect(backup).to.not.haveOwnProperty('keyParams')

    await Factory.safeDeinit(application)
  })

  it('encrypted backup file should have keyParams', async function () {
    await application.addPasscode('passcode')
    const backup = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(backup).to.haveOwnProperty('keyParams')
  })

  it('decrypted backup file should not have itemsKeys', async function () {
    const backup = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(backup.items.some((item) => item.content_type === ContentType.TYPES.ItemsKey)).to.be.false
  })

  it('encrypted backup file should have itemsKeys', async function () {
    await application.addPasscode('passcode')
    const backup = (await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    expect(backup.items.some((item) => item.content_type === ContentType.TYPES.ItemsKey)).to.be.true
  })

  it('backup file with no account and no passcode should be decrypted', async function () {
    const note = await Factory.createSyncedNote(application)
    const backup = (await application.createDecryptedBackupFile.execute()).getValue()
    expect(backup).to.not.haveOwnProperty('keyParams')
    expect(backup.items.some((item) => item.content_type === ContentType.TYPES.ItemsKey)).to.be.false
    expect(backup.items.find((item) => item.content_type === ContentType.TYPES.Note).uuid).to.equal(note.uuid)
    let error
    try {
      ;(await application.createEncryptedBackupFile.execute({ skipAuthorization: true })).getValue()
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
  })
})
