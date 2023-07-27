import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vaults', function () {
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
    await context.register()

    vaults = context.vaults
  })

  it('should update vault name and description', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'new vault name',
      description: 'new vault description',
    })

    const updatedVault = vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(updatedVault.name).to.equal('new vault name')
    expect(updatedVault.description).to.equal('new vault description')

    const promise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await promise

    const contactVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(contactVault.name).to.equal('new vault name')
    expect(contactVault.description).to.equal('new vault description')

    await deinitContactContext()
  })

  it('being removed from a shared vault should remove the vault', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const result = await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    expect(result.isFailed()).to.be.false

    const promise = contactContext.resolveWhenUserMessagesProcessingCompletes()
    await contactContext.sync()
    await promise

    expect(contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })).to.be.undefined
    expect(contactContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(contactContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    const recreatedContext = await Factory.createAppContextWithRealCrypto(contactContext.identifier)
    await recreatedContext.launch()

    expect(recreatedContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })).to.be.undefined
    expect(recreatedContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(recreatedContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    await deinitContactContext()
    await recreatedContext.deinit()
  })

  it('deleting a shared vault should remove vault from contact context', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const result = await context.sharedVaults.deleteSharedVault(sharedVault)

    expect(result).to.be.undefined

    const promise = contactContext.resolveWhenUserMessagesProcessingCompletes()
    await contactContext.sync()
    await promise

    expect(contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })).to.be.undefined
    expect(contactContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(contactContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    const recreatedContext = await Factory.createAppContextWithRealCrypto(contactContext.identifier)
    await recreatedContext.launch()

    expect(recreatedContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })).to.be.undefined
    expect(recreatedContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(recreatedContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    await deinitContactContext()
    await recreatedContext.deinit()
  })

  it('should convert a vault to a shared vault', async () => {
    const privateVault = await context.vaults.createRandomizedVault({
      name: 'My Private Vault',
    })

    const note = await context.createSyncedNote('foo', 'bar')
    await context.vaults.moveItemToVault(privateVault, note)

    const sharedVault = await context.sharedVaults.convertVaultToSharedVault(privateVault)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    const contextNote = thirdPartyContext.items.findItem(note.uuid)
    expect(contextNote).to.not.be.undefined
    expect(contextNote.title).to.equal('foo')
    expect(contextNote.text).to.equal(note.text)

    await deinitThirdPartyContext()
  })
})
