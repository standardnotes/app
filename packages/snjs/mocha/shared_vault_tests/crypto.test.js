import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault crypto', function () {
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

  describe('asymmetric messages', () => {
    it('encrypted strings should include sender signing public key and signature', async () => {})

    it('embedded signature verification should fail if embedded signing key is altered', async () => {})

    it('decrypting asymmetric message without trusted signer key should result in non-trusted result', async () => {})

    it('decrypting asymmetric message with trusted signer key should result in trusted result', async () => {})
  })

  describe('symmetrically encrypted items', () => {
    it('should require asymmetric signature if item keySystemIdentifier or sharedVaultUuid is specified', async () => {})

    it('should allow asymmetric signature if item is not shared or belongs to key system if user root key has signing key pair', async () => {})

    it('should allow client verification of authenticity of shared item changes', async () => {})

    it('encrypting an item into storage then loading it should verify authenticity of original content rather than most recent symmetric signature', async () => {

    })
  })
})
