import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaults

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()

    application = context.application
    vaults = context.vaults
  })

  describe('offline', function () {
    it('should be able to create an offline vault', async () => {
      const keySystemIdentifier = await vaults.createVault()

      expect(keySystemIdentifier).to.not.be.undefined
      expect(typeof keySystemIdentifier).to.equal('string')

      const vaultItemsKey = context.items.getPrimaryVaultItemsKeyForVault(keySystemIdentifier)
      expect(vaultItemsKey).to.not.be.undefined
      expect(vaultItemsKey.key_system_identifier).to.equal(keySystemIdentifier)
      expect(vaultItemsKey.keyTimestamp).to.not.be.undefined
      expect(vaultItemsKey.keyVersion).to.not.be.undefined
    })

    it('should add item to offline vault', async () => {
      const keySystemIdentifier = await vaults.createVault()
      const item = await context.createSyncedNote()

      await vaults.addItemToVault(keySystemIdentifier, item)

      const updatedItem = context.items.findItem(item.uuid)
      expect(updatedItem.key_system_identifier).to.equal(keySystemIdentifier)
    })

    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const keySystemIdentifier = await vaults.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaults.addItemToVault(keySystemIdentifier, note)
      await context.deinit()

      const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      const updatedNote = recreatedContext.application.items.findItem(note.uuid)
      expect(updatedNote.title).to.equal('foo')
      expect(updatedNote.text).to.equal('bar')
    })

    describe('porting from offline to online', () => {
      it('should maintain vault system identifiers across items after registration', async () => {
        const appIdentifier = context.identifier
        const keySystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(keySystemIdentifier, note)

        await context.register()
        await context.sync()

        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const notes = recreatedContext.notes
        expect(notes.length).to.equal(1)

        const updatedNote = recreatedContext.application.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')
        expect(updatedNote.key_system_identifier).to.equal(keySystemIdentifier)
      })

      it('should decrypt vault items', async () => {
        const appIdentifier = context.identifier
        const keySystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(keySystemIdentifier, note)

        await context.register()
        await context.sync()

        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const updatedNote = recreatedContext.application.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')
      })
    })
  })

  describe('online', () => {
    beforeEach(async () => {
      await context.register()
    })

    it('should create a vault', async () => {
      const keySystemIdentifier = await vaults.createVault()
      expect(keySystemIdentifier).to.not.be.undefined

      const vaultItemsKeys = application.items.getAllVaultItemsKeysForVault(keySystemIdentifier)
      expect(vaultItemsKeys.length).to.equal(1)

      const vaultItemsKey = vaultItemsKeys[0]
      expect(vaultItemsKey instanceof VaultItemsKey).to.be.true
      expect(vaultItemsKey.key_system_identifier).to.equal(keySystemIdentifier)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const keySystemIdentifier = await vaults.createVault()

      await vaults.addItemToVault(keySystemIdentifier, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.key_system_identifier).to.equal(keySystemIdentifier)
    })

    describe('client timing', () => {
      it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
        const appIdentifier = context.identifier
        const keySystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(keySystemIdentifier, note)
        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const updatedNote = recreatedContext.application.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')
      })
    })

    describe('vault key rotation', () => {
      it('rotating a vault key should create a new vault items key', async () => {
        const keySystemIdentifier = await vaults.createVault()

        const vaultItemsKey = context.items.getAllVaultItemsKeysForVault(keySystemIdentifier)[0]

        await vaults.rotateVaultKey(keySystemIdentifier)

        const updatedVaultItemsKey = context.items.getAllVaultItemsKeysForVault(keySystemIdentifier)[0]

        expect(updatedVaultItemsKey).to.not.be.undefined
        expect(updatedVaultItemsKey.uuid).to.not.equal(vaultItemsKey.uuid)
      })

      it('should keep vault key copy with greater keyTimestamp if conflict', async () => {
        const keySystemIdentifier = await vaults.createVault()
        const vaultKeyCopy = context.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)

        const otherClient = await Factory.createAppContextWithRealCrypto()
        await otherClient.launch()
        otherClient.email = context.email
        otherClient.password = context.password
        await otherClient.signIn(context.email, context.password)

        context.lockSyncing()
        otherClient.lockSyncing()

        const olderTimestamp = vaultKeyCopy.keyTimestamp + 1
        const newerTimestamp = vaultKeyCopy.keyTimestamp + 2

        await context.application.items.changeItem(vaultKeyCopy, (mutator) => {
          mutator.mutableContent.key = 'new-vault-key'
          mutator.mutableContent.keyTimestamp = olderTimestamp
        })

        const otherVaultKey = otherClient.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)
        await otherClient.application.items.changeItem(otherVaultKey, (mutator) => {
          mutator.mutableContent.key = 'new-vault-key'
          mutator.mutableContent.keyTimestamp = newerTimestamp
        })

        context.unlockSyncing()
        otherClient.unlockSyncing()

        await otherClient.sync()
        await context.sync()

        expect(context.items.getItems(ContentType.VaultKeyCopy).length).to.equal(1)
        expect(otherClient.items.getItems(ContentType.VaultKeyCopy).length).to.equal(1)

        const vaultKeyAfterSync = context.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)
        const otherVaultKeyAfterSync = otherClient.items.getPrimarySyncedVaultKeyCopy(keySystemIdentifier)

        expect(vaultKeyAfterSync.keyTimestamp).to.equal(otherVaultKeyAfterSync.keyTimestamp)
        expect(vaultKeyAfterSync.key).to.equal(otherVaultKeyAfterSync.key)
        expect(vaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
        expect(otherVaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

        await otherClient.deinit()
      })

      it('deleting a vault should delete all its items', async () => {
        const keySystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(keySystemIdentifier, note)

        await vaults.deleteVault(keySystemIdentifier)

        const updatedNote = context.application.items.findItem(note.uuid)
        expect(updatedNote).to.be.undefined
      })
    })
  })
})
