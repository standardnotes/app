import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('keypair change', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  it('contacts should be able to handle receiving multiple keypair changed messages and trust them in order', async () => {
    console.error('TODO: implement test')
  })

  it('should not trust messages sent with previous key pair', async () => {
    console.error('TODO: implement test')
  })

  it('should reupload invites after rotating keypair', async () => {
    console.error('TODO: implement test')
  })

  it('should reupload asymmetric messages after rotating keypair', async () => {
    console.error('TODO: implement test')
  })
})
