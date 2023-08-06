
import './vendor/chai-as-promised-built.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('utils', async function () {
  it('stringToArrayBuffer', async function () {
    const str = 'hello world'
    const buffer = await stringToArrayBuffer(str)
    expect(buffer.byteLength).to.equal(11)
    expect(await arrayBufferToString(buffer)).to.equal(str)
  })

  it('arrayBufferToString', async function () {
    const str = 'hello world'
    const buffer = await stringToArrayBuffer(str)
    const result = await arrayBufferToString(buffer)
    expect(result).to.equal(str)
    expect(await stringToArrayBuffer(result)).to.eql(buffer)
  })

  it('arrayBufferToHexString', async function () {
    const str = 'hello world'
    const buffer = await stringToArrayBuffer(str)
    const hex = await arrayBufferToHexString(buffer)
    expect(hex).to.equal('68656c6c6f20776f726c64')
  })

  it('hexStringToArrayBuffer', async function () {
    const hex = '68656c6c6f20776f726c64'
    const buffer = await hexStringToArrayBuffer(hex)
    expect(buffer.byteLength).to.equal(11)
  })

  it('base64Encode', async function () {
    const str = 'hello world'
    const b64 = await base64Encode(str)
    expect(b64).to.equal('aGVsbG8gd29ybGQ=')
  })

  it('base64URLEncode', async function () {
    const str = 'hello world'
    const b64 = await base64URLEncode(str)
    expect(b64).to.equal('aGVsbG8gd29ybGQ')
  })

  it('base64Decode', async function () {
    const b64 = 'aGVsbG8gd29ybGQ='
    const str = await base64Decode(b64)
    expect(str).to.equal('hello world')
  })

  it('base64ToArrayBuffer', async function () {
    const b64 = 'aGVsbG8gd29ybGQ='
    const buffer = await base64ToArrayBuffer(b64)
    expect(buffer.byteLength).to.equal(11)
  })

  it('arrayBufferToBase64', async function () {
    const b64 = 'aGVsbG8gd29ybGQ='
    const buffer = await base64ToArrayBuffer(b64)
    const result = await arrayBufferToBase64(buffer)
    expect(result).to.equal(b64)
  })

  it('hexToBase64', async function () {
    const hex = '68656c6c6f20776f726c64'
    const result = await hexToBase64(hex)
    expect(result).to.equal('aGVsbG8gd29ybGQ=')
  })

  it('base64ToHex', async function () {
    const b64 = 'aGVsbG8gd29ybGQ='
    const result = await base64ToHex(b64)
    expect(result).to.equal('68656c6c6f20776f726c64')
  })

  /**
   * Table of test values for base32 from RFC4648
   * https://datatracker.ietf.org/doc/html/rfc4648#section-10
   */
  const base32TestPair = [
    { text: '', base32: '' },
    { text: 'f', base32: 'MY======' },
    { text: 'fo', base32: 'MZXQ====' },
    { text: 'foo', base32: 'MZXW6===' },
    { text: 'foob', base32: 'MZXW6YQ=' },
    { text: 'fooba', base32: 'MZXW6YTB' },
    { text: 'foobar', base32: 'MZXW6YTBOI======' },
  ]

  it('base32Encode', async function () {
    const encoder = new TextEncoder()
    for (let pair of base32TestPair) {
      const result = base32Encode(encoder.encode(pair.text).buffer)
      expect(result).to.equal(pair.base32)
    }
  })

  it('base32Decode', async function () {
    const decoder = new TextDecoder()
    for (let pair of base32TestPair) {
      const bufferResult = base32Decode(pair.base32)
      const result = decoder.decode(bufferResult)
      expect(result).to.equal(pair.text)
    }
  })
})
