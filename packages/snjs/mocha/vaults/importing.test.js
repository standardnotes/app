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

  describe('exports', () => {
    describe('no account and no passcode', () => {
      it('should throw if attempting to create encrypted backup', async () => {
        const vault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
        })

        const note = await context.createSyncedNote('foo', 'bar')
        await Collaboration.moveItemToVault(context, vault, note)

        await context.application.vaultLocks.lockNonPersistentVault(vault)

        await Factory.expectThrowsAsync(
          () => context.application.createEncryptedBackupFile.execute(),
          'Attempting root key encryption with no root key',
        )
      })

      it('decrypted backups should export unlocked password vaulted items as decrypted and locked as encrypted', async () => {
        const lockedVault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
        })
        const lockedVaultNote = await context.createSyncedNote('foo', 'bar')
        await Collaboration.moveItemToVault(context, lockedVault, lockedVaultNote)
        await context.application.vaultLocks.lockNonPersistentVault(lockedVault)

        const unlockedVault = await context.vaults.createUserInputtedPasswordVault({
          name: 'test vault',
          userInputtedPassword: 'test password',
          storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
        })
        const unlockedVaultNote = await context.createSyncedNote('har', 'zar')
        await Collaboration.moveItemToVault(context, unlockedVault, unlockedVaultNote)

        const backupData = (await context.application.createDecryptedBackupFile.execute()).getValue()

        const backupLockedVaultNote = backupData.items.find((item) => item.uuid === lockedVaultNote.uuid)
        expect(isEncryptedPayload(backupLockedVaultNote)).to.be.true

        const backupUnlockedVaultNote = backupData.items.find((item) => item.uuid === unlockedVaultNote.uuid)
        expect(isEncryptedPayload(backupUnlockedVaultNote)).to.be.false
      })
    })
  })

  describe('imports', () => {
    describe('password vaults', () => {
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
  })
})
