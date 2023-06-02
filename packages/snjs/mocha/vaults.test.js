import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vaults', function () {
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
      const vaultSystemIdentifier = await vaults.createVault()

      expect(vaultSystemIdentifier).to.not.be.undefined
      expect(typeof vaultSystemIdentifier).to.equal('string')

      const vaultItemsKey = context.items.getPrimaryVaultItemsKeyForVault(vaultSystemIdentifier)
      expect(vaultItemsKey).to.not.be.undefined
      expect(vaultItemsKey.vault_system_identifier).to.equal(vaultSystemIdentifier)
      expect(vaultItemsKey.keyTimestamp).to.not.be.undefined
      expect(vaultItemsKey.keyVersion).to.not.be.undefined
    })

    it('should add item to offline vault', async () => {
      const vaultSystemIdentifier = await vaults.createVault()
      const item = await context.createSyncedNote()

      await vaults.addItemToVault(vaultSystemIdentifier, item)

      const updatedItem = context.items.findItem(item.uuid)
      expect(updatedItem.vault_system_identifier).to.equal(vaultSystemIdentifier)
    })

    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vaultSystemIdentifier = await vaults.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaults.addItemToVault(vaultSystemIdentifier, note)
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
        const vaultSystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vaultSystemIdentifier, note)

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
        expect(updatedNote.vault_system_identifier).to.equal(vaultSystemIdentifier)
      })

      it('should decrypt vault items', async () => {
        const appIdentifier = context.identifier
        const vaultSystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vaultSystemIdentifier, note)

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
      const vaultSystemIdentifier = await vaults.createVault()
      expect(vaultSystemIdentifier).to.not.be.undefined

      const vaultItemsKeys = application.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)
      expect(vaultItemsKeys.length).to.equal(1)

      const vaultItemsKey = vaultItemsKeys[0]
      expect(vaultItemsKey instanceof VaultItemsKey).to.be.true
      expect(vaultItemsKey.vault_system_identifier).to.equal(vaultSystemIdentifier)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const vaultSystemIdentifier = await vaults.createVault()

      await vaults.addItemToVault(vaultSystemIdentifier, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_system_identifier).to.equal(vaultSystemIdentifier)
    })

    describe('client timing', () => {
      it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
        const appIdentifier = context.identifier
        const vaultSystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vaultSystemIdentifier, note)
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
        const vaultSystemIdentifier = await vaults.createVault()

        const vaultItemsKey = context.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

        await vaults.rotateVaultKey(vaultSystemIdentifier)

        const updatedVaultItemsKey = context.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

        expect(updatedVaultItemsKey).to.not.be.undefined
        expect(updatedVaultItemsKey.uuid).to.not.equal(vaultItemsKey.uuid)
      })

      it('should keep vault key copy with greater keyTimestamp if conflict', async () => {
        const vaultSystemIdentifier = await vaults.createVault()
        const vaultKeyCopy = context.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)

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

        const otherVaultKey = otherClient.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)
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

        const vaultKeyAfterSync = context.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)
        const otherVaultKeyAfterSync = otherClient.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)

        expect(vaultKeyAfterSync.keyTimestamp).to.equal(otherVaultKeyAfterSync.keyTimestamp)
        expect(vaultKeyAfterSync.key).to.equal(otherVaultKeyAfterSync.key)
        expect(vaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
        expect(otherVaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

        await otherClient.deinit()
      })

      it('deleting a vault should delete all its items', async () => {
        const vaultSystemIdentifier = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vaultSystemIdentifier, note)

        await vaults.deleteVault(vaultSystemIdentifier)

        const updatedNote = context.application.items.findItem(note.uuid)
        expect(updatedNote).to.be.undefined
      })
    })
  })
})
