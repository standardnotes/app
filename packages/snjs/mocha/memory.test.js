/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

/**
 * Simple empty test page to create and deinit empty application
 * Then check browser Memory tool to make sure there are no leaks.
 */
describe('memory', function () {
  before(async function () {
    localStorage.clear()
  })

  after(async function () {
    localStorage.clear()
  })

  beforeEach(async function () {
    this.application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    this.application = null
  })

  it('passes', async function () {
    expect(true).to.equal(true)
  })
})
