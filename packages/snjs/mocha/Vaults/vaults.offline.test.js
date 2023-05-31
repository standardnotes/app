import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('offline vaults', function () {
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

  it('should be able to create an offline vault', async () => {
    const vault = await vaultService.createVault()

    expect(vault).to.not.be.undefined
    expect(vault.uuid).to.not.be.undefined
    expect(vault.specifiedItemsKeyUuid).to.not.be.undefined
    expect(vault.vaultKeyTimestamp).to.not.be.undefined

    const vaultItemsKey = context.items.getVaultItemsKeysForVault(vault.uuid)[0]
    expect(vaultItemsKey).to.not.be.undefined
    expect(vaultItemsKey.uuid).to.equal(vault.specifiedItemsKeyUuid)
  })

  it('should add item to offline vault', async () => {
    const vault = await vaultService.createVault()
    const item = await context.createSyncedNote()

    await vaultService.addItemToVault(vault, item)

    const updatedItem = context.items.findItem(item.uuid)
    expect(updatedItem.vault_uuid).to.equal(vault.uuid)
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
    it.only('should create server vaults for all offline vaults', async () => {
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
      expect(updatedNote.vault_uuid).to.equal(vault.uuid)
    })

    it('should alternate uuid of vault if attempting to create a server one fails', async () => {})

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
