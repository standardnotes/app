import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vaults', function () {
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
    context = undefined
  })

  it('should update vault name and description', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.changeVaultName(sharedVault, {
      name: 'new vault name',
      description: 'new vault description',
    })

    const updatedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(updatedVault.name).to.equal('new vault name')
    expect(updatedVault.description).to.equal('new vault description')

    contactContext.unlockSyncing()
    await contactContext.syncAndAwaitMessageProcessing()

    const contactVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(contactVault.name).to.equal('new vault name')
    expect(contactVault.description).to.equal('new vault description')

    await deinitContactContext()
  })

  it('being removed from a shared vault should remove the vault', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const result = await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)
    expect(result.isFailed()).to.be.false

    await contactContext.syncAndAwaitNotificationsProcessing()

    expect(contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
    expect(contactContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(contactContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    const recreatedContext = await Factory.createVaultsContextWithRealCrypto(contactContext.identifier)
    await recreatedContext.launch()

    expect(recreatedContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
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

    await contactContext.syncAndAwaitNotificationsProcessing()

    expect(contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
    expect(contactContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
    expect(contactContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

    const recreatedContext = await Factory.createVaultsContextWithRealCrypto(contactContext.identifier)
    await recreatedContext.launch()

    expect(recreatedContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
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

  it('syncing a shared vault exclusively should not retrieve non vault items', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await contactContext.createSyncedNote('foo', 'bar')

    const syncPromise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()

    await contactContext.application.sync.syncSharedVaultsFromScratch([sharedVault.sharing.sharedVaultUuid])

    const syncResponse = await syncPromise

    const expectedItems = ['key system items key']

    expect(syncResponse.retrievedPayloads.length).to.equal(expectedItems.length)

    await deinitContactContext()
  })

  it('syncing a shared vault with note exclusively should retrieve note and items key', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const syncPromise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()

    await contactContext.application.sync.syncSharedVaultsFromScratch([sharedVault.sharing.sharedVaultUuid])

    const syncResponse = await syncPromise

    const expectedItems = ['key system items key', 'note']

    expect(syncResponse.retrievedPayloads.length).to.equal(expectedItems.length)

    await deinitContactContext()
  })

  it('regular sync should not needlessly return vault items', async () => {
    await Collaboration.createSharedVault(context)

    const promise = context.resolveWithSyncRetrievedPayloads()

    await context.sync()

    const retrievedPayloads = await promise

    expect(retrievedPayloads.length).to.equal(0)
  })
})
