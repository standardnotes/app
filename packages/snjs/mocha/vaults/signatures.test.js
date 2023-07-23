import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('signatures', function () {
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

  it('signatures should be marked as of questionable integrity when signed with non root contact public key', async () => {
    console.error('TODO: implement test')
  })

  it('items marked with questionable integrity should have option to trust the item which would resync it', async () => {
    console.error('TODO: implement test')
  })
})
