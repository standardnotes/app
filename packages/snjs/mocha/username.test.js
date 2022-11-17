chai.use(chaiAsPromised)
const expect = chai.expect

describe('private username', () => {
  it('generates private username', async () => {
    const username = 'myusername'

    const result = await ComputePrivateUsername(new SNWebCrypto(), username)

    expect(result).to.equal('9aae57db8dbb233291a49cb7b8ab902336ec785e04f3be70157b8c1669014d0d')
  })
})
