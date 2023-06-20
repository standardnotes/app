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

    const updatedVault = vaults.getVault(sharedVault.systemIdentifier)
    expect(updatedVault.name).to.equal('new vault name')
    expect(updatedVault.description).to.equal('new vault description')

    const promise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await promise

    const contactVault = contactContext.vaults.getVault(sharedVault.systemIdentifier)
    expect(contactVault.name).to.equal('new vault name')
    expect(contactVault.description).to.equal('new vault description')

    await deinitContactContext()
  })

  it('should convert a vault to a shared vault', async () => {
    console.error('TODO')
  })

  it('should send metadata change message when changing name or description', async () => {
    console.error('TODO')
  })
})
