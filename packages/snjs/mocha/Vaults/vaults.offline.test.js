import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('offline vaults', function () {
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

  describe('offline vaults', () => {
    it('should be able to create an offline vault', async () => {
      const vault = await vaultService.createVault()

      expect(vault).to.not.be.undefined
      expect(vault.uuid).to.not.be.undefined
      expect(vault.specifiedItemsKey).to.not.be.undefined
      expect(vault.keyTimestamp).to.not.be.undefined

      const vaultItemsKey = await context.items.getVaultItemsKeysForVault(vault.uuid)[0]
      expect(vaultItemsKey).to.not.be.undefined
      expect(vaultItemsKey.uuid).to.equal(vault.specifiedItemsKey)
    })

    it('should add item to offline vault', async () => {
      const vault = await vaultService.createVault()
      const item = await context.createSyncedNote()

      await vaultService.addItemToVault(item, vault)

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

    it('offline vaults should port to online vaults after signing in or registering', async () => {
      console.error('TODO - implement test case')
    })
  })
})
