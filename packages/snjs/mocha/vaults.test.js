import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaultService

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()

    application = context.application
    vaultService = application.vaultService
  })

  describe.only('offline', function () {
    it('should be able to create an offline vault', async () => {
      const vault = await vaultService.createVault()

      expect(vault).to.not.be.undefined
      expect(vault.uuid).to.not.be.undefined
      expect(vault.specifiedItemsKeyUuid).to.not.be.undefined
      expect(vault.vaultKeyTimestamp).to.not.be.undefined

      const vaultItemsKey = context.items.getAllVaultItemsKeysForVault(vault.uuid)[0]
      expect(vaultItemsKey).to.not.be.undefined
      expect(vaultItemsKey.uuid).to.equal(vault.specifiedItemsKeyUuid)
    })

    it('should add item to offline vault', async () => {
      const vault = await vaultService.createVault()
      const item = await context.createSyncedNote()

      await vaultService.addItemToVault(vault, item)

      const updatedItem = context.items.findItem(item.uuid)
      expect(updatedItem.vault_system_identifier).to.equal(vault.uuid)
    })

    it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vault = await vaultService.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
      await context.deinit()

      const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      const updatedNote = recreatedContext.application.items.findItem(note.uuid)
      expect(updatedNote.title).to.equal('foo')
      expect(updatedNote.text).to.equal('bar')
    })

    describe('porting from offline to online', () => {
      it('should create server vaults for all offline vaults', async () => {
        const appIdentifier = context.identifier
        const vault = await vaultService.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaultService.addItemToVault(vault, note)

        await context.register()
        await context.sync()

        await context.deinit()

        const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
        await recreatedContext.launch()

        const notes = recreatedContext.notes
        expect(notes.length).to.equal(1)

        const remoteVaults = await recreatedContext.vaultService.reloadRemoteVaults()
        expect(remoteVaults.length).to.equal(1)
        expect(remoteVaults[0].uuid).to.equal(vault.uuid)

        const updatedNote = recreatedContext.application.items.findItem(note.uuid)
        expect(updatedNote.title).to.equal('foo')
        expect(updatedNote.text).to.equal('bar')
        expect(updatedNote.vault_system_identifier).to.equal(vault.uuid)
      })

      it('should alternate uuid of vault if attempting to create a server one fails', async () => {
        console.error('TODO: implement')
      })

      it('should decrypt vault items', async () => {
        const appIdentifier = context.identifier
        const vault = await vaultService.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaultService.addItemToVault(vault, note)

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
      const vault = await vaultService.createVault()
      expect(vault).to.not.be.undefined

      const vaultItemsKeys = application.items.getAllVaultItemsKeysForVault(vault.uuid)
      expect(vaultItemsKeys.length).to.equal(1)

      const vaultItemsKey = vaultItemsKeys[0]
      expect(vaultItemsKey instanceof VaultItemsKey).to.be.true
      expect(vaultItemsKey.vault_system_identifier).to.equal(vault.uuid)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const vault = await vaultService.createVault()

      await vaultService.addItemToVault(vault, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_system_identifier).to.equal(vault.uuid)
    })

    describe('client timing', () => {
      it('should load data in the correct order at startup to allow vault items and their keys to decrypt', async () => {
        const appIdentifier = context.identifier
        const vault = await vaultService.createVault()
        const note = await context.createSyncedNote('foo', 'bar')
        await vaultService.addItemToVault(vault, note)
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
        const vault = await vaultService.createVault()

        const vaultItemsKey = context.items.getAllVaultItemsKeysForVault(vault.uuid)[0]

        await vaultService.rotateVaultKey(vault.uuid)

        const updatedVaultItemsKey = context.items.getAllVaultItemsKeysForVault(vault.uuid)[0]

        expect(updatedVaultItemsKey).to.not.be.undefined
        expect(updatedVaultItemsKey.uuid).to.not.equal(vaultItemsKey.uuid)
      })

      it('should keep vault key with greater keyTimestamp if conflict', async () => {
        const vault = await vaultService.createVault()
        const vaultKey = vaultService.getPrimarySyncedVaultKeyCopy(vault.uuid)

        const otherClient = await Factory.createAppContextWithRealCrypto()
        await otherClient.launch()
        otherClient.email = context.email
        otherClient.password = context.password
        await otherClient.signIn(context.email, context.password)

        context.lockSyncing()
        otherClient.lockSyncing()

        const olderTimestamp = vaultKey.keyTimestamp + 1
        const newerTimestamp = vaultKey.keyTimestamp + 2

        await context.application.items.changeItem(vaultKey, (mutator) => {
          mutator.content = {
            vaultKey: 'new-vault-key',
            keyTimestamp: olderTimestamp,
          }
        })

        const otherVaultKey = otherClient.vaultService.getPrimarySyncedVaultKeyCopy(vault.uuid)
        await otherClient.application.items.changeItem(otherVaultKey, (mutator) => {
          mutator.content = {
            vaultKey: 'new-vault-key',
            keyTimestamp: newerTimestamp,
          }
        })

        context.unlockSyncing()
        otherClient.unlockSyncing()

        await otherClient.sync()
        await context.sync()

        expect(context.items.getItems(ContentType.VaultKeyCopy).length).to.equal(1)
        expect(otherClient.items.getItems(ContentType.VaultKeyCopy).length).to.equal(1)

        const vaultKeyAfterSync = context.vaultService.getPrimarySyncedVaultKeyCopy(vault.uuid)
        const otherVaultKeyAfterSync = otherClient.vaultService.getPrimarySyncedVaultKeyCopy(vault.uuid)

        expect(vaultKeyAfterSync.keyTimestamp).to.equal(otherVaultKeyAfterSync.keyTimestamp)
        expect(vaultKeyAfterSync.vaultKey).to.equal(otherVaultKeyAfterSync.vaultKey)
        expect(vaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
        expect(otherVaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

        await otherClient.deinit()
      })
    })
  })
})
