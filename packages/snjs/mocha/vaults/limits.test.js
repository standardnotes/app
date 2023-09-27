import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault limits', function () {
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

  describe('free users', () => {
    it('should not allow creating vaults over the limit', async () => {
      const firstSharedVault = await Collaboration.createSharedVault(context)
      expect(firstSharedVault).to.not.be.null

      let caughtError = null
      try {
        await Collaboration.createSharedVault(context)
      } catch (error) {
        caughtError = error
      }

      expect(caughtError.message).to.equal('Failed to create shared vault: You have reached the limit of shared vaults for your account.')
    })
  })

  describe('plus users', () => {
    it('should not allow creating vaults over the limit', async () => {
      await context.activatePaidSubscriptionForUser({ subscriptionPlanName: 'PLUS_PLAN' })

      for (let i = 0; i < 3; i++) {
        const vault = await Collaboration.createSharedVault(context)
        expect(vault).to.not.be.null
      }

      let caughtError = null
      try {
        await Collaboration.createSharedVault(context)
      } catch (error) {
        caughtError = error
      }

      expect(caughtError.message).to.equal('Failed to create shared vault: You have reached the limit of shared vaults for your account.')
    })
  })

  describe('pro users', () => {
    it('should allow creating vaults without limit', async () => {
      await context.activatePaidSubscriptionForUser()

      for (let i = 0; i < 10; i++) {
        const vault = await Collaboration.createSharedVault(context)
        expect(vault).to.not.be.null
      }
    }).timeout(Factory.SixtySecondTimeout)
  })
})
