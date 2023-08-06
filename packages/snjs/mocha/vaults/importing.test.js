import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.skip('vault importing', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
  })

  it('should import vaulted items with synced root key', async () => {
    console.error('TODO: implement')
  })

  it('should import vaulted items with non-present root key', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(context, vault, note)

    const backupData = await context.application.createEncryptedBackupFileForAutomatedDesktopBackups()

    const otherContext = await Factory.createVaultsContextWithRealCrypto()
    await otherContext.launch()

    await otherContext.application.importData(backupData)

    const expectedImportedItems = ['vault-items-key', 'note']
    const invalidItems = otherContext.items.invalidItems
    expect(invalidItems.length).to.equal(expectedImportedItems.length)

    const encryptedItem = invalidItems[0]
    expect(encryptedItem.key_system_identifier).to.equal(vault.systemIdentifier)
    expect(encryptedItem.errorDecrypting).to.be.true
    expect(encryptedItem.uuid).to.equal(note.uuid)

    await otherContext.deinit()
  })
})
