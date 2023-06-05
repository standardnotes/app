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

    const promise = context.resolveWhenSharedVaultChangeInvitesAreSent(sharedVault.sharedVaultUuid)
    await vaults.changeVaultNameAndDescription(sharedVault.systemIdentifier, {
      name: 'new vault name',
      description: 'new vault description',
    })
    await promise

    const updatedVault = vaults.getVault(sharedVault.systemIdentifier)
    expect(updatedVault.decrypted.name).to.equal('new vault name')
    expect(updatedVault.decrypted.description).to.equal('new vault description')

    await contactContext.sync()

    const contactVault = contactContext.vaults.getVault(sharedVault.systemIdentifier)
    expect(contactVault.decrypted.name).to.equal('new vault name')
    expect(contactVault.decrypted.description).to.equal('new vault description')

    await deinitContactContext()
  })
})
