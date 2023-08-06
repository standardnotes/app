chai.use(chaiAsPromised)
const expect = chai.expect

describe('000 legacy protocol operations', () => {
  let protocol004

  beforeEach(async () => {
    localStorage.clear()

    protocol004 = new SNProtocolOperator004(new SNWebCrypto())
  })

  afterEach(async () => {
    localStorage.clear()
  })

  it('cannot decode 000 item', function () {
    const string =
      '000eyJyZWZlcmVuY2VzIjpbeyJ1dWlkIjoiZGMwMDUwZWUtNWQyNi00MGMyLWJjMjAtYzU1ZWE1Yjc4MmUwIiwiY29udGVudF90eXBlIjoiU058VXNlclByZWZlcmVuY2VzIn1dLCJhcHBEYXRhIjp7Im9yZy5zdGFuZGFyZG5vdGVzLnNuIjp7ImNsaWVudF91cGRhdGVkX2F0IjoiMjAyMC0wNC0wOFQxNDoxODozNC4yNzBaIn19LCJ0aXRsZSI6IjAuMDMyMzc3OTQyMDUxNzUzMzciLCJ0ZXh0Ijoid29ybGQifQ=='

    let error
    try {
      protocol004.generateDecryptedParameters({
        uuid: 'foo',
        content: string,
        content_type: 'foo',
      })
    } catch (e) {
      error = e
    }

    expect(error).to.be.ok
  })
})
