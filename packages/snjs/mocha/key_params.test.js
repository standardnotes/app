
import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('key params', function () {
  this.timeout(Factory.TenSecondTimeout)

  beforeEach(async function () {
    localStorage.clear()
  })

  afterEach(async function () {
    localStorage.clear()
  })

  it('extraneous parameters in key params should be ignored when ejecting', async function () {
    const params = new SNRootKeyParams({
      identifier: 'foo',
      pw_cost: 110000,
      pw_nonce: 'bar',
      pw_salt: 'salt',
      version: '003',
      origination: 'registration',
      created: new Date().getTime(),
      hash: '123',
      foo: 'bar',
    })
    const ejected = params.getPortableValue()
    expect(ejected.hash).to.not.be.ok
    expect(ejected.pw_cost).to.be.ok
    expect(ejected.pw_nonce).to.be.ok
    expect(ejected.pw_salt).to.be.ok
    expect(ejected.version).to.be.ok
    expect(ejected.origination).to.be.ok
    expect(ejected.created).to.be.ok
    expect(ejected.identifier).to.be.ok
  })

  describe('with missing version', function () {
    it('should default to 002 if uses high cost', async function () {
      const params = new SNRootKeyParams({
        identifier: 'foo',
        pw_cost: 101000,
        pw_nonce: 'bar',
        pw_salt: 'salt',
      })

      expect(params.version).to.equal('002')
    })

    it('should default to 001 if uses low cost', async function () {
      const params = new SNRootKeyParams({
        identifier: 'foo',
        pw_cost: 60000,
        pw_nonce: 'bar',
        pw_salt: 'salt',
      })

      expect(params.version).to.equal('002')
    })

    it('should default to 002 if uses cost seen in both 001 and 002, but has no pw_nonce', async function () {
      const params = new SNRootKeyParams({
        identifier: 'foo',
        pw_cost: 60000,
        pw_nonce: undefined,
        pw_salt: 'salt',
      })

      expect(params.version).to.equal('002')
    })

    it('should default to 001 if uses cost seen in both 001 and 002, but is more likely a 001 cost', async function () {
      const params = new SNRootKeyParams({
        identifier: 'foo',
        pw_cost: 5000,
        pw_nonce: 'bar',
        pw_salt: 'salt',
      })

      expect(params.version).to.equal('001')
    })
  })
})
