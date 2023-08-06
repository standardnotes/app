
import './vendor/chai-as-promised-built.js'

chai.use(chaiAsPromised)

/**
 * Simple empty test page to create and deinit empty page
 * Then check browser Memory tool to make sure there are no leaks.
 */
describe('memory', async function () {
  it('cleanup', function () {
    this.webCrypto = new SNWebCrypto()
    this.webCrypto.deinit()
    this.webCrypto = null
  })
})
