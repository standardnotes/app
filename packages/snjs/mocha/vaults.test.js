import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('vaults', function () {
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

  describe('offline', function () {
    it('should be able to create an offline vault', async () => {
      const vault = await vaults.createVault()

      expect(vault.systemIdentifier).to.not.be.undefined
      expect(typeof vault.systemIdentifier).to.equal('string')

      const keySystemItemsKey = context.items.getPrimaryKeySystemItemsKey(vault.systemIdentifier)
      expect(keySystemItemsKey).to.not.be.undefined
      expect(keySystemItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
      expect(keySystemItemsKey.keyTimestamp).to.not.be.undefined
      expect(keySystemItemsKey.keyVersion).to.not.be.undefined
    })

    it('should add item to offline vault', async () => {
      const vault = await vaults.createVault()
      const item = await context.createSyncedNote()

      await vaults.addItemToVault(vault, item)

      const updatedItem = context.items.findItem(item.uuid)
      expect(updatedItem.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vault = await vaults.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaults.addItemToVault(vault, note)
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
        const vault = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vault, note)

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
        const vault = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vault, note)

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
      const vault = await vaults.createVault()
      expect(vault).to.not.be.undefined

      const keySystemItemsKeys = context.items.getKeySystemItemsKeys(vault.systemIdentifier)
      expect(keySystemItemsKeys.length).to.equal(1)

      const keySystemItemsKey = keySystemItemsKeys[0]
      expect(keySystemItemsKey instanceof KeySystemItemsKey).to.be.true
      expect(keySystemItemsKey.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const vault = await vaults.createVault()

      await vaults.addItemToVault(vault, note)

      const updatedNote = context.items.findItem(note.uuid)
      expect(updatedNote.key_system_identifier).to.equal(vault.systemIdentifier)
    })

    describe('client timing', () => {
      it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
        const appIdentifier = context.identifier
        const vault = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vault, note)
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
        const vault = await vaults.createVault()

        const keySystemItemsKey = context.items.getKeySystemItemsKeys(vault.systemIdentifier)[0]

        await vaults.rotateKeySystemRootKey(vault.systemIdentifier)

        const updatedKeySystemItemsKey = context.items.getKeySystemItemsKeys(vault.systemIdentifier)[0]

        expect(updatedKeySystemItemsKey).to.not.be.undefined
        expect(updatedKeySystemItemsKey.uuid).to.not.equal(keySystemItemsKey.uuid)
      })

      it('should keep key system root key with greater keyTimestamp if conflict', async () => {
        const vault = await vaults.createVault()
        const keySystemRootKey = context.items.getPrimaryKeySystemRootKey(vault.systemIdentifier)

        const otherClient = await Factory.createAppContextWithRealCrypto()
        await otherClient.launch()
        otherClient.email = context.email
        otherClient.password = context.password
        await otherClient.signIn(context.email, context.password)

        context.lockSyncing()
        otherClient.lockSyncing()

        const olderTimestamp = keySystemRootKey.keyTimestamp + 1
        const newerTimestamp = keySystemRootKey.keyTimestamp + 2

        await context.items.changeItem(keySystemRootKey, (mutator) => {
          mutator.mutableContent.key = 'new-vault-key'
          mutator.mutableContent.keyTimestamp = olderTimestamp
        })

        const otherKeySystemRootKey = otherClient.items.getPrimaryKeySystemRootKey(vault.systemIdentifier)
        await otherClient.items.changeItem(otherKeySystemRootKey, (mutator) => {
          mutator.mutableContent.key = 'new-vault-key'
          mutator.mutableContent.keyTimestamp = newerTimestamp
        })

        context.unlockSyncing()
        otherClient.unlockSyncing()

        await otherClient.sync()
        await context.sync()

        expect(context.items.getItems(ContentType.KeySystemRootKey).length).to.equal(1)
        expect(otherClient.items.getItems(ContentType.KeySystemRootKey).length).to.equal(1)

        const keySystemRootKeyAfterSync = context.items.getPrimaryKeySystemRootKey(vault.systemIdentifier)
        const otherKeySystemRootKeyAfterSync = otherClient.items.getPrimaryKeySystemRootKey(vault.systemIdentifier)

        expect(keySystemRootKeyAfterSync.keyTimestamp).to.equal(otherKeySystemRootKeyAfterSync.keyTimestamp)
        expect(keySystemRootKeyAfterSync.key).to.equal(otherKeySystemRootKeyAfterSync.key)
        expect(keySystemRootKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
        expect(otherKeySystemRootKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

        await otherClient.deinit()
      })

      it('deleting a vault should delete all its items', async () => {
        const vault = await vaults.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaults.addItemToVault(vault, note)

        await vaults.deleteVault(vault)

        const updatedNote = context.items.findItem(note.uuid)
        expect(updatedNote).to.be.undefined
      })
    })
  })
})
