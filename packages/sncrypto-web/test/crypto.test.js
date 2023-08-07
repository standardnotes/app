
import './vendor/chai-as-promised-built.js'
import './vendor/buffer@5.6.0.js'

const Buffer = window.buffer.Buffer

chai.use(chaiAsPromised)
const expect = chai.expect

describe('crypto operations', async function () {
  let webCrypto = new SNWebCrypto()

  after(() => {
    webCrypto.deinit()
    webCrypto = null
  })

  it('webcrypto should be defined', function () {
    expect(window.crypto).to.not.be.null
  })

  it('generates valid uuid', async function () {
    expect(webCrypto.generateUUID().length).to.equal(36)
  })

  it('properly encodes base64', async function () {
    const source = 'hello world 🌍'
    const target = 'aGVsbG8gd29ybGQg8J+MjQ=='
    expect(await base64Encode(source)).to.equal(target)
  })

  it('properly encodes base64 in url safe mode', async function () {
    const source = 'hello world 🌍'
    const target = 'aGVsbG8gd29ybGQg8J-MjQ'
    expect(await base64URLEncode(source)).to.equal(target)
  })

  it('properly decodes base64', async function () {
    const source = 'aGVsbG8gd29ybGQg8J+MjQ=='
    const target = 'hello world 🌍'
    expect(await base64Decode(source)).to.equal(target)
  })

  it('generates proper length generic key', async function () {
    const length = 256
    const wcResult = await webCrypto.generateRandomKey(length)
    expect(wcResult.length).to.equal(length / 4)
  })

  it('compares strings with timing safe comparison', async function () {
    const crypto = new SNWebCrypto()
    expect(crypto.timingSafeEqual('hello world 🌍', 'hello world 🌍')).to.equal(true)
    expect(crypto.timingSafeEqual('helo world 🌍', 'hello world 🌍')).to.equal(false)
    expect(crypto.timingSafeEqual('', 'a')).to.equal(false)
    expect(crypto.timingSafeEqual('', '')).to.equal(true)
    expect(
      crypto.timingSafeEqual('2e1ee7920bb188a88f94bb912153befd83cc55cd', '2e1ee7920bb188a88f94bb912153befd83cc55cd'),
    ).to.equal(true)
    expect(
      crypto.timingSafeEqual('1e1ee7920bb188a88f94bb912153befd83cc55cd', '2e1ee7920bb188a88f94bb912153befd83cc55cd'),
    ).to.equal(false)
    expect(
      crypto.timingSafeEqual('2e1ee7920bb188a88f94bb912153befd83cc55cc', '2e1ee7920bb188a88f94bb912153befd83cc55cd'),
    ).to.equal(false)
  })

  it('random key length', async function () {
    const key = await webCrypto.generateRandomKey(256)
    expect(key.length).to.equal(64)
  })

  it('pbkdf2 1', async function () {
    const password = 'very_secure🔒'
    const salt = 'c3feb78823adce65c4ab024dab9c5cdcda5a04cdbd98f65eac0311dfa432d67b'
    const expected = 'bbb3d3af19dd1cbb901c958003faa55f193aad6a57fff30e51a62591bdc054d8'
    const result = await webCrypto.pbkdf2(password, salt, 100000, 256)
    expect(result).to.equal(expected)
  })

  it('pbkdf2 2', async function () {
    const password = 'correct horse battery staple ✅'
    const salt = Buffer.from('808182838485868788898a8b8c8d8e8f', 'hex').toString('utf8')
    const expected = '795d83b18e55d860d3799f85a20f66ee17eb9dcf041df1d7a13fac30af7103d9'
    const result = await webCrypto.pbkdf2(password, salt, 100000, 256)
    expect(result).to.equal(expected)
  })

  it('aes cbc', async function () {
    const iv = await webCrypto.generateRandomKey(128)
    const key = await webCrypto.generateRandomKey(256)
    const text = 'hello world 🌍'
    const encrypted = await webCrypto.aes256CbcEncrypt(text, iv, key)
    const decrypted = await webCrypto.aes256CbcDecrypt(encrypted, iv, key)
    expect(decrypted).to.equal(text)
  })

  it('hmac 256', async function () {
    const text = 'hello world 🌍'
    const key = 'e802dc953f3f1f7b5db62409b74ac848559d4711c4e0047ecc5e312ad8ab8397'
    const hash = await webCrypto.hmac256(text, key)
    const expected = 'b63f94ee33a067ffac3ee97c7987dd3171dcdc747a322bb3f3ab890201c8e6f9'
    expect(hash).to.equal(expected)
  })

  it('sha256', async function () {
    const text = 'hello world 🌍'
    const hash = await webCrypto.sha256(text)
    const expected = '1e71fe32476da1ff115b44dfd74aed5c90d68a1d80a2033065e30cff4335211a'
    expect(hash).to.equal(expected)
  })

  it('hmac 1', async function () {
    const text = 'hello world 🌍'
    const key = '73756d6d657274696d65'
    const hash = await webCrypto.hmac1(text, key)
    const expected = '534bc6ff40d4616e9be4fb530093d5f7f87173fa'
    expect(hash).to.equal(expected)
  })

  it('sha1', async function () {
    const text = 'hello world 🌍'
    const hash = await webCrypto.unsafeSha1(text)
    const expected = '0818667aed20ac104ca8f300f8df9753e1937983'
    expect(hash).to.equal(expected)
  })

  it('argon2 predefined salt', async function () {
    /** This differs from libsodium.js test matching below in that we include an emoji at the end */
    const password = 'correct horse battery staple ✅'
    const salt = '808182838485868788898a8b8c8d8e8f'
    const bytes = 67108864
    const length = 16
    const iterations = 2
    const result = await webCrypto.argon2(password, salt, iterations, bytes, length)
    const expectedResult = '18dfbc268f251701652c8e38b5273f73'
    expect(result).to.equal(expectedResult)
  })

  it('argon2 generated salt', async function () {
    const rawSalt = await webCrypto.sha256(['foo', 'bar'].join(':'))
    const truncatedSalt = rawSalt.substring(0, rawSalt.length / 2)
    const password = 'foobarfoo🔒'
    const bytes = 67108864
    const length = 32
    const iterations = 5
    const result = await webCrypto.argon2(password, truncatedSalt, iterations, bytes, length)
    const expected = 'bb6ec440708c271ce34decd7f997e2444d309b1105992779ccdb47f78a5fda6f'
    expect(result).to.equal(expected)
  })

  it('xchacha20 encrypt/decrypt', async function () {
    const key = await webCrypto.generateRandomKey(256)
    const nonce = await webCrypto.generateRandomKey(192)
    const plaintext = 'hello world 🌍'
    const aad = JSON.stringify({ uuid: '123🎤' })
    const ciphertext = await webCrypto.xchacha20Encrypt(plaintext, nonce, key, aad)
    const decrypted = await webCrypto.xchacha20Decrypt(ciphertext, nonce, key, aad)
    expect(decrypted).to.equal(plaintext)
  })

  it('xchacha20 streaming encrypt/decrypt', async function () {
    const key = await webCrypto.generateRandomKey(256)
    const bigFile = await fetch('http://localhost:9003/test/resources/big_file.md')
    const bigText = await bigFile.text()
    const plaintext = bigText
    const plainBuffer = stringToArrayBuffer(plaintext)
    const encryptor = webCrypto.xchacha20StreamInitEncryptor(key)

    const headerBase64 = encryptor.header
    const headerBuffer = base64ToArrayBuffer(encryptor.header)

    let encryptedBuffer = Buffer.concat([headerBuffer])
    const pushChunkSize = plainBuffer.length / 200
    const pullChunkSize = pushChunkSize + SodiumConstant.CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_ABYTES

    for (let i = 0; i < plainBuffer.length; i += pushChunkSize) {
      const readUntil = i + pushChunkSize > plainBuffer.length ? plainBuffer.length : i + pushChunkSize
      const chunk = webCrypto.xchacha20StreamEncryptorPush(encryptor, plainBuffer.slice(i, readUntil))
      encryptedBuffer = Buffer.concat([encryptedBuffer, chunk])
    }

    const decryptor = webCrypto.xchacha20StreamInitDecryptor(headerBase64, key)

    let decryptedBuffer = Buffer.alloc(0)
    for (let i = headerBuffer.length; i < encryptedBuffer.length; i += pullChunkSize) {
      const readUntil = i + pullChunkSize > encryptedBuffer.length ? encryptedBuffer.length : i + pullChunkSize
      const chunk = webCrypto.xchacha20StreamDecryptorPush(decryptor, encryptedBuffer.slice(i, readUntil))
      decryptedBuffer = Buffer.concat([decryptedBuffer, chunk.message])
    }

    const decryptedPlain = arrayBufferToString(decryptedBuffer)
    expect(decryptedPlain).to.equal(plaintext)
  })

  it('xchacha20 should fail with nonmatching aad', async function () {
    const key = await webCrypto.generateRandomKey(256)
    const nonce = await webCrypto.generateRandomKey(192)
    const plaintext = 'hello world 🌍'
    const ciphertext = await webCrypto.xchacha20Encrypt(plaintext, nonce, key, JSON.stringify({ uuid: 'foo🎲' }))
    const result = await webCrypto.xchacha20Decrypt(ciphertext, nonce, key, JSON.stringify({ uuid: 'bar🎲' }))
    expect(result).to.not.be.ok
  })

  it('xchacha predefined string', async function () {
    /** This differs from libsodium.js test matching below in that we include an emoji at the end */
    const plaintext =
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.🌞"
    const assocData = await hexStringToArrayBuffer('50515253c0c1c2c3c4c5c6c7')
    const nonce = '404142434445464748494a4b4c4d4e4f5051525354555657'
    const key = '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f'
    const ciphertext = await webCrypto.xchacha20Encrypt(plaintext, nonce, key, assocData)
    const expected =
      'vW0XnT6D1DuVdleUk8DpOVcqFwAlK/rMvtKQLCE5bLtzHH8bC0qmRAvzqC9O2n45rmTGcIxUwhbLlrcuEhO0Ui+Mm6QNtdlFsRtpuYLBu54/P6wrw2lIj3ayODVl0//5IflmTJdjfal2iBL2FcaLE7UuOqw6kdl7HV6PKzn0pIOeHH3rkwQ='
    expect(ciphertext).to.equal(expected)
    const decrypted = await webCrypto.xchacha20Decrypt(ciphertext, nonce, key, assocData)
    expect(decrypted).to.equal(plaintext)
  })

  it('xchacha libsodium.js test matching', async function () {
    /* Same values as https://github.com/jedisct1/libsodium.js/blob/master/test/sodium_utils.js */
    const plaintext = Buffer.from(
      '4c616469657320616e642047656e746c656d656e206f662074686520636c6173' +
        '73206f66202739393a204966204920636f756c64206f6666657220796f75206f' +
        '6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73' +
        '637265656e20776f756c642062652069742e',
      'hex',
    ).toString('utf8')
    const assocData = Buffer.from('50515253c0c1c2c3c4c5c6c7', 'hex')
    const nonce = '404142434445464748494a4b4c4d4e4f5051525354555657'
    const key = '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f'

    /** Encrypt */
    const ciphertextBase64 = await webCrypto.xchacha20Encrypt(plaintext, nonce, key, assocData)
    const ciphertextHex = await base64ToHex(ciphertextBase64)
    const expected =
      'bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb' +
      '731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b452' +
      '2f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff9' +
      '21f9664c97637da9768812f615c68b13b52e' +
      'c0875924c1c7987947deafd8780acf49'
    expect(ciphertextHex).to.equal(expected)

    /** Decrypt */
    const decrypted = await webCrypto.xchacha20Decrypt(ciphertextBase64, nonce, key, assocData)
    expect(decrypted).to.equal(plaintext)
  })

  it('argon2 libsodium.js test matching', async function () {
    /* Same values as https://github.com/jedisct1/libsodium.js/blob/master/test/sodium_utils.js */
    const password = 'correct horse battery staple'
    const salt = '808182838485868788898a8b8c8d8e8f'
    const bytes = 67108864
    const length = 16
    const iterations = 2
    const result = await webCrypto.argon2(password, salt, iterations, bytes, length)
    const expectedResult = '720f95400220748a811bca9b8cff5d6e'
    expect(result).to.equal(expectedResult)
  })

  it('pkc crypto_box_easy keypair generation', async function () {
    const seed = await webCrypto.generateRandomKey(32)
    const keypair = await webCrypto.sodiumCryptoBoxSeedKeypair(seed)
    expect(keypair.keyType).to.equal('x25519')
    expect(keypair.publicKey.length).to.equal(64)
    expect(keypair.privateKey.length).to.equal(64)
  })

  it('pkc crypto_box_easy encrypt/decrypt', async function () {
    const seed = await webCrypto.generateRandomKey(32)
    const senderKeyPair = await webCrypto.sodiumCryptoBoxSeedKeypair(seed)
    const recipientKeyPair = await webCrypto.sodiumCryptoBoxSeedKeypair(seed)

    const nonce = await webCrypto.generateRandomKey(192)
    const plaintext = 'hello world 🌍'

    const ciphertext = await webCrypto.sodiumCryptoBoxEasyEncrypt(
      plaintext,
      nonce,
      recipientKeyPair.publicKey,
      senderKeyPair.privateKey,
    )

    expect(ciphertext.length).to.equal(44)

    const decrypted = await webCrypto.sodiumCryptoBoxEasyDecrypt(
      ciphertext,
      nonce,
      senderKeyPair.publicKey,
      recipientKeyPair.privateKey,
    )

    expect(decrypted).to.equal(plaintext)
  })

  it('generates random OTP secret 160 bits long', async function () {
    const secret = await webCrypto.generateOtpSecret()
    expect(secret).to.have.length(32)
    expect(secret).to.not.include('=')
  })

  it('generates valid HOTP tokens', async function () {
    /**
     * Test data acquired from RFC4226
     * https://datatracker.ietf.org/doc/html/rfc4226#page-32
     */
    const encoder = new TextEncoder()
    const secret = '12345678901234567890'
    const b32Secret = base32Encode(encoder.encode(secret))
    const hotpTest = [
      '755224',
      '287082',
      '359152',
      '969429',
      '338314',
      '254676',
      '287922',
      '162583',
      '399871',
      '520489',
    ]

    for (let counter = 0; counter < hotpTest.length; counter++) {
      const hotp = hotpTest[counter]
      const result = await webCrypto.hotpToken(b32Secret, counter)
      expect(result).to.equal(hotp)
    }
  })

  it('generates valid TOTP tokens', async function () {
    /**
     * Test data acquired from RFC6238
     * https://datatracker.ietf.org/doc/html/rfc6238#appendix-B
     */
    const encoder = new TextEncoder()
    const secret = '12345678901234567890'
    const b32Secret = base32Encode(encoder.encode(secret))
    const tokenLength = 8
    const totpTest = [
      { time: 59000, totp: '94287082' },
      { time: 1111111109000, totp: '07081804' },
      { time: 1111111111000, totp: '14050471' },
      { time: 1234567890000, totp: '89005924' },
      { time: 2000000000000, totp: '69279037' },
    ]

    for (let { time, totp } of totpTest) {
      const result = await webCrypto.totpToken(b32Secret, time, tokenLength)
      expect(result).to.equal(totp)
    }
  })
})
