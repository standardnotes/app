import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('asymmetric messages', function () {
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

  it('should delete message after processing it', async () => {})

  it('should send contact share message after trusted contact belonging to group changes', async () => {})

  it('should not send contact share message to self or to contact who is changed', async () => {})

  it('should send shared vault root key change message after root key change', async () => {})

  it('should send shared vault root key change message after shared vault name change', async () => {})

  it('should send own keypair changed message to trusted contacts', async () => {})

  it('own keypair changed message should be signed using old key pair', async () => {})

  it('own keypair changed message should contain new keypair and be trusted', async () => {})

  describe('keypair revocation', () => {
    it('should be able to revoke non-current keypair', async () => {})

    it('revoking a keypair should send a keypair revocation event to trusted contacts', async () => {})

    it('should not be able to revoke current key pair', async () => {})

    it('should distrust revoked keypair as contact', async () => {})
  })
})
