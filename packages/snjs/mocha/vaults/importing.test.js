import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault importing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
    context = undefined
  })

  describe('randomized vaults', () => {
    it('should import backup file for randomized vault created without account or passcode', async () => {
      const vault = await context.vaults.createRandomizedVault({
        name: 'test vault',
      })

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, vault, note)

      const backupData = (await context.application.createDecryptedBackupFile.execute()).getValue()

      const otherContext = await Factory.createVaultsContextWithRealCrypto()
      otherContext.password = context.password
      await otherContext.launch()

      const result = (await otherContext.application.importData(backupData)).getValue()

      const invalidItems = otherContext.items.invalidItems
      expect(invalidItems.length).to.equal(0)

      expect(result.affectedItems.length).to.equal(backupData.items.length)

      const itemsKey = result.affectedItems.find((item) => item.content_type === ContentType.TYPES.KeySystemItemsKey)
      expect(itemsKey.key_system_identifier).to.equal(vault.systemIdentifier)

      const importedNote = result.affectedItems.find((item) => item.content_type === ContentType.TYPES.Note)
      expect(importedNote.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(importedNote.uuid).to.equal(note.uuid)

      const importedRootKey = result.affectedItems.find(
        (item) => item.content_type === ContentType.TYPES.KeySystemRootKey,
      )
      expect(importedRootKey.systemIdentifier).to.equal(vault.systemIdentifier)

      await otherContext.deinit()
    })

    it('should import synced-key vaulted items by decrypting', async () => {
      await context.register()

      const vault = await context.vaults.createRandomizedVault({
        name: 'test vault',
      })

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, vault, note)

      const backupData = (
        await context.application.createEncryptedBackupFile.execute({ skipAuthorization: true })
      ).getValue()

      const otherContext = await Factory.createVaultsContextWithRealCrypto()
      otherContext.password = context.password
      await otherContext.launch()

      const result = (await otherContext.application.importData(backupData)).getValue()

      const invalidItems = otherContext.items.invalidItems
      expect(invalidItems.length).to.equal(0)

      expect(result.affectedItems.length).to.equal(backupData.items.length)

      const itemsKey = result.affectedItems.find((item) => item.content_type === ContentType.TYPES.KeySystemItemsKey)
      expect(itemsKey.key_system_identifier).to.equal(vault.systemIdentifier)

      const importedNote = result.affectedItems.find((item) => item.content_type === ContentType.TYPES.Note)
      expect(importedNote.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(importedNote.uuid).to.equal(note.uuid)

      const importedRootKey = result.affectedItems.find(
        (item) => item.content_type === ContentType.TYPES.KeySystemRootKey,
      )
      expect(importedRootKey.systemIdentifier).to.equal(vault.systemIdentifier)

      await otherContext.deinit()
    })
  })

  describe('password vaults', () => {
    it('should export *locked* password vaulted items as encrypted even if no account and no passcode', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, vault, note)

      await context.application.vaultLocks.lockNonPersistentVault(vault)

      const backupData = (await context.application.createDecryptedBackupFile.execute()).getValue()

      const encryptedItemsKey = backupData.items.find(
        (item) => item.content_type === ContentType.TYPES.KeySystemItemsKey,
      )
      expect(encryptedItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(isEncryptedPayload(encryptedItemsKey)).to.be.true

      const encryptedNote = backupData.items.find((item) => item.content_type === ContentType.TYPES.Note)
      expect(encryptedNote.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(isEncryptedPayload(encryptedNote)).to.be.true
    })

    it.only('should export *unlocked* password vaulted items as encrypted even if no account and no passcode', async () => {
      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, vault, note)

      const backupData = (await context.application.createDecryptedBackupFile.execute()).getValue()

      const encryptedItemsKey = backupData.items.find(
        (item) => item.content_type === ContentType.TYPES.KeySystemItemsKey,
      )
      expect(encryptedItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(isEncryptedPayload(encryptedItemsKey)).to.be.true

      const encryptedNote = backupData.items.find((item) => item.content_type === ContentType.TYPES.Note)
      expect(encryptedNote.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(isEncryptedPayload(encryptedNote)).to.be.true
    })

    it('should import password vaulted items with non-present root key as-is without decrypting', async () => {
      await context.register()

      const vault = await context.vaults.createUserInputtedPasswordVault({
        name: 'test vault',
        userInputtedPassword: 'test password',
        storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
      })

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, vault, note)

      const backupData = (
        await context.application.createEncryptedBackupFile.execute({ skipAuthorization: true })
      ).getValue()

      const otherContext = await Factory.createVaultsContextWithRealCrypto()
      otherContext.password = context.password
      await otherContext.launch()

      await otherContext.application.importData(backupData)

      const expectedImportedItems = ['vault-items-key', 'note']
      const invalidItems = otherContext.items.invalidItems
      expect(invalidItems.length).to.equal(expectedImportedItems.length)

      const encryptedItemsKey = invalidItems.find((item) => item.content_type === ContentType.TYPES.KeySystemItemsKey)
      expect(encryptedItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(encryptedItemsKey.errorDecrypting).to.be.true

      const encryptedNote = invalidItems.find((item) => item.content_type === ContentType.TYPES.Note)
      expect(encryptedNote.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(encryptedNote.errorDecrypting).to.be.true
      expect(encryptedNote.uuid).to.equal(note.uuid)

      await otherContext.deinit()
    })
  })
})
