import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let vaults

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()

    vaults = context.vaults
  })

  describe('locking', () => {
    it('should throw if attempting to add item to locked vault', async () => {
      console.error('TODO: implement')
    })

    it('should throw if attempting to remove item from locked vault', async () => {
      console.error('TODO: implement')
    })

    it('locking vault should remove root key and items keys from memory', async () => {
      console.error('TODO: implement')
    })
  })

  describe('offline', function () {
    it('should be able to create an offline vault', async () => {
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })

      expect(vault.systemIdentifier).to.not.be.undefined
      expect(typeof vault.systemIdentifier).to.equal('string')

      const keySystemItemsKey = context.keys.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
      expect(keySystemItemsKey).to.not.be.undefined
      expect(keySystemItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(keySystemItemsKey.creationTimestamp).to.not.be.undefined
      expect(keySystemItemsKey.keyVersion).to.not.be.undefined
    })

    it('should be able to create an offline vault with app passcode', async () => {
      await context.application.addPasscode('123')
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })

      expect(vault.systemIdentifier).to.not.be.undefined
      expect(typeof vault.systemIdentifier).to.equal('string')

      const keySystemItemsKey = context.keys.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
      expect(keySystemItemsKey).to.not.be.undefined
      expect(keySystemItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(keySystemItemsKey.creationTimestamp).to.not.be.undefined
      expect(keySystemItemsKey.keyVersion).to.not.be.undefined
    })

    it('should add item to offline vault', async () => {
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })
      const item = await context.createSyncedNote()

      await vaults.moveItemToVault(vault, item)

      const updatedItem = context.items.findItem(item.uuid)
      expect(updatedItem.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })
      const note = await context.createSyncedNote('foo', 'bar')
      await vaults.moveItemToVault(vault, note)
      await context.deinit()

      const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      const updatedNote = recreatedContext.items.findItem(note.uuid)
      expect(updatedNote.title).to.equal('foo')
      expect(updatedNote.text).to.equal('bar')

      await recreatedContext.deinit()
    })

    describe('porting from offline to online', () => {
      it('should maintain vault system identifiers across items after registration', async () => {
        const appIdentifier = context.identifier
        const vault = await vaults.createRandomizedVault({
          name: 'My Vault',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.moveItemToVault(vault, note)

        await context.register()
        await context.sync()

        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const notes = recreatedContext.notes
        expect(notes.length).to.equal(1)

        const updatedNote = recreatedContext.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')
        expect(updatedNote.key_system_identifier).to.equal(vault.systemIdentifier)

        await recreatedContext.deinit()
      })

      it('should decrypt vault items', async () => {
        const appIdentifier = context.identifier
        const vault = await vaults.createRandomizedVault({
          name: 'My Vault',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.moveItemToVault(vault, note)

        await context.register()
        await context.sync()

        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const updatedNote = recreatedContext.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')

        await recreatedContext.deinit()
      })
    })
  })

  describe('online', () => {
    beforeEach(async () => {
      await context.register()
    })

    it('should create a vault', async () => {
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })
      expect(vault).to.not.be.undefined

      const keySystemItemsKeys = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)
      expect(keySystemItemsKeys.length).to.equal(1)

      const keySystemItemsKey = keySystemItemsKeys[0]
      expect(keySystemItemsKey instanceof KeySystemItemsKey).to.be.true
      expect(keySystemItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const vault = await vaults.createRandomizedVault({
        name: 'My Vault',
        storagePreference: KeySystemRootKeyStorageMode.Synced,
      })

      await vaults.moveItemToVault(vault, note)

      const updatedNote = context.items.findItem(note.uuid)
      expect(updatedNote.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    describe('client timing', () => {
      it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
        const appIdentifier = context.identifier
        const vault = await vaults.createRandomizedVault({
          name: 'My Vault',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.moveItemToVault(vault, note)
        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const updatedNote = recreatedContext.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')

        await recreatedContext.deinit()
      })
    })

    describe('key system root key rotation', () => {
      it('rotating a key system root key should create a new vault items key', async () => {
        const vault = await vaults.createRandomizedVault({
          name: 'My Vault',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })

        const keySystemItemsKey = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)[0]

        await vaults.rotateVaultRootKey(vault)

        const updatedKeySystemItemsKey = context.keys.getKeySystemItemsKeys(vault.systemIdentifier)[0]

        expect(updatedKeySystemItemsKey).to.not.be.undefined
        expect(updatedKeySystemItemsKey.uuid).to.not.equal(keySystemItemsKey.uuid)
      })

      it('deleting a vault should delete all its items', async () => {
        const vault = await vaults.createRandomizedVault({
          name: 'My Vault',
          storagePreference: KeySystemRootKeyStorageMode.Synced,
        })
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.moveItemToVault(vault, note)

        await vaults.deleteVault(vault)

        const updatedNote = context.items.findItem(note.uuid)
        expect(updatedNote).to.be.undefined
      })
    })
  })
})
