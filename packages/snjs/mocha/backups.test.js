/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('backups', function () {
  before(function () {
    localStorage.clear()
  })

  after(function () {
    localStorage.clear()
  })

  beforeEach(async function () {
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    this.application = null
  })

  const BASE_ITEM_COUNT_ENCRYPTED = ['ItemsKey', 'UserPreferences'].length
  const BASE_ITEM_COUNT_DECRYPTED = ['UserPreferences'].length

  it('backup file should have a version number', async function () {
    let data = await this.application.createDecryptedBackupFile()
    expect(data.version).to.equal(this.application.protocolService.getLatestVersion())
    await this.application.addPasscode('passcode')
    data = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(data.version).to.equal(this.application.protocolService.getLatestVersion())
  })

  it('no passcode + no account backup file should have correct number of items', async function () {
    await Promise.all([Factory.createSyncedNote(this.application), Factory.createSyncedNote(this.application)])
    const data = await this.application.createDecryptedBackupFile()
    expect(data.items.length).to.equal(BASE_ITEM_COUNT_DECRYPTED + 2)
  })

  it('passcode + no account backup file should have correct number of items', async function () {
    const passcode = 'passcode'
    await this.application.addPasscode(passcode)
    await Promise.all([Factory.createSyncedNote(this.application), Factory.createSyncedNote(this.application)])

    // Encrypted backup without authorization
    const encryptedData = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(encryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)

    // Encrypted backup with authorization
    Factory.handlePasswordChallenges(this.application, passcode)
    const authorizedEncryptedData = await this.application.createEncryptedBackupFile()
    expect(authorizedEncryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)
  })

  it('no passcode + account backup file should have correct number of items', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    await Promise.all([Factory.createSyncedNote(this.application), Factory.createSyncedNote(this.application)])

    // Encrypted backup without authorization
    const encryptedData = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(encryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)

    Factory.handlePasswordChallenges(this.application, this.password)

    // Decrypted backup
    const decryptedData = await this.application.createDecryptedBackupFile()
    expect(decryptedData.items.length).to.equal(BASE_ITEM_COUNT_DECRYPTED + 2)

    // Encrypted backup with authorization
    const authorizedEncryptedData = await this.application.createEncryptedBackupFile()
    expect(authorizedEncryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)
  })

  it('passcode + account backup file should have correct number of items', async function () {
    this.timeout(10000)
    const passcode = 'passcode'
    await this.application.register(this.email, this.password)
    Factory.handlePasswordChallenges(this.application, this.password)
    await this.application.addPasscode(passcode)
    await Promise.all([Factory.createSyncedNote(this.application), Factory.createSyncedNote(this.application)])

    // Encrypted backup without authorization
    const encryptedData = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(encryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)

    Factory.handlePasswordChallenges(this.application, passcode)

    // Decrypted backup
    const decryptedData = await this.application.createDecryptedBackupFile()
    expect(decryptedData.items.length).to.equal(BASE_ITEM_COUNT_DECRYPTED + 2)

    // Encrypted backup with authorization
    const authorizedEncryptedData = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(authorizedEncryptedData.items.length).to.equal(BASE_ITEM_COUNT_ENCRYPTED + 2)
  })

  it('backup file item should have correct fields', async function () {
    await Factory.createSyncedNote(this.application)
    let backupData = await this.application.createDecryptedBackupFile()
    let rawItem = backupData.items.find((i) => i.content_type === ContentType.Note)

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
      application: this.application,
      email: this.email,
      password: this.password,
    })

    backupData = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    rawItem = backupData.items.find((i) => i.content_type === ContentType.Note)

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
    await Factory.createSyncedNote(this.application)

    const note = await Factory.createSyncedNote(this.application)

    const encrypted = await this.application.protocolService.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })

    const errored = encrypted.copy({
      errorDecrypting: true,
    })

    await this.application.itemManager.emitItemFromPayload(errored)

    const erroredItem = this.application.itemManager.findAnyItem(errored.uuid)

    expect(erroredItem.errorDecrypting).to.equal(true)

    const backupData = await this.application.createDecryptedBackupFile()

    expect(backupData.items.length).to.equal(BASE_ITEM_COUNT_DECRYPTED + 2)
  })

  it('decrypted backup file should not have keyParams', async function () {
    const backup = await this.application.createDecryptedBackupFile()
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

    const backup = await application.createDecryptedBackupFile()

    expect(backup).to.not.haveOwnProperty('keyParams')

    await Factory.safeDeinit(application)
  })

  it('encrypted backup file should have keyParams', async function () {
    await this.application.addPasscode('passcode')
    const backup = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(backup).to.haveOwnProperty('keyParams')
  })

  it('decrypted backup file should not have itemsKeys', async function () {
    const backup = await this.application.createDecryptedBackupFile()
    expect(backup.items.some((item) => item.content_type === ContentType.ItemsKey)).to.be.false
  })

  it('encrypted backup file should have itemsKeys', async function () {
    await this.application.addPasscode('passcode')
    const backup = await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    expect(backup.items.some((item) => item.content_type === ContentType.ItemsKey)).to.be.true
  })

  it('backup file with no account and no passcode should be decrypted', async function () {
    const note = await Factory.createSyncedNote(this.application)
    const backup = await this.application.createDecryptedBackupFile()
    expect(backup).to.not.haveOwnProperty('keyParams')
    expect(backup.items.some((item) => item.content_type === ContentType.ItemsKey)).to.be.false
    expect(backup.items.find((item) => item.content_type === ContentType.Note).uuid).to.equal(note.uuid)
    let error
    try {
      await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
  })
})
