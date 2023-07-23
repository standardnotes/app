export default class FakeWebCrypto {
  constructor() {}

  deinit() {}

  initialize() {
    return
  }

  randomString(len) {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let randomString = ''
    for (let i = 0; i < len; i++) {
      const randomPoz = Math.floor(Math.random() * charSet.length)
      randomString += charSet.substring(randomPoz, randomPoz + 1)
    }
    return randomString
  }

  generateUUIDSync = () => {
    const globalScope = getGlobalScope()
    const crypto = globalScope.crypto || globalScope.msCrypto
    if (crypto) {
      const buf = new Uint32Array(4)
      crypto.getRandomValues(buf)
      let idx = -1
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        idx++
        const r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    } else {
      let d = new Date().getTime()
      if (globalScope.performance && typeof globalScope.performance.now === 'function') {
        d += performance.now() // use high-precision timer if available
      }
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
      return uuid
    }
  }

  generateUUID = () => {
    return this.generateUUIDSync()
  }

  timingSafeEqual(a, b) {
    return a === b
  }

  base64Encode(text) {
    return btoa(text)
  }

  base64URLEncode(text) {
    return this.base64Encode(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '')
  }

  base64Decode(base64String) {
    return atob(base64String)
  }

  async pbkdf2(password, salt, iterations, length) {
    return btoa(password + salt + iterations)
  }

  generateRandomKey(bits) {
    const bitsPerHexChar = 4
    const length = bits / bitsPerHexChar
    return this.randomString(length)
  }

  async aes256CbcEncrypt(plaintext, iv, key) {
    const data = {
      plaintext,
      iv,
      key,
    }
    return btoa(JSON.stringify(data))
  }

  async aes256CbcDecrypt(ciphertext, iv, key) {
    const data = JSON.parse(atob(ciphertext))
    if (data.key !== key || data.iv !== iv) {
      return undefined
    }
    return data.plaintext
  }

  async hmac256(message, key) {
    return btoa(message + key)
  }

  async sha256(text) {
    return new SNWebCrypto().sha256(text)
  }

  async hmac1(message, key) {
    return btoa(message + key)
  }

  async unsafeSha1(text) {
    return btoa(text)
  }

  argon2(password, salt, iterations, bytes, length) {
    const bitsPerHexChar = 4
    const bitsInByte = 8
    const encoded = btoa(password)
    const desiredLength = length * (bitsInByte / bitsPerHexChar)
    const missingLength = desiredLength - encoded.length
    const result = `${encoded}${encoded.repeat(Math.ceil(missingLength / encoded.length))}`.slice(0, desiredLength)
    return result
  }

  xchacha20Encrypt(plaintext, nonce, key, assocData) {
    const data = {
      plaintext,
      nonce,
      key,
      assocData,
    }
    return btoa(JSON.stringify(data))
  }

  xchacha20Decrypt(ciphertext, nonce, key, assocData) {
    const data = JSON.parse(atob(ciphertext))
    if (data.key !== key || data.nonce !== nonce || data.assocData !== assocData) {
      return undefined
    }
    return data.plaintext
  }

  sodiumCryptoBoxEasyEncrypt(message, nonce, senderSecretKey, recipientPublicKey) {
    const data = {
      message,
      nonce,
      recipientPublicKey,
      senderSecretKey,
    }
    return btoa(JSON.stringify(data))
  }

  sodiumCryptoBoxEasyDecrypt(ciphertext, nonce, senderPublicKey, recipientSecretKey) {
    const data = JSON.parse(atob(ciphertext))
    if (
      data.senderPublicKey !== senderPublicKey ||
      data.recipientSecretKey !== recipientSecretKey ||
      data.nonce !== nonce ||
      data.assocData !== assocData
    ) {
      return undefined
    }
    return data.message
  }

  sodiumCryptoSign(message, secretKey) {
    const data = {
      message,
      secretKey,
    }
    return btoa(JSON.stringify(data))
  }

  sodiumCryptoKdfDeriveFromKey(key, subkeyNumber, subkeyLength, context) {
    return btoa(key + subkeyNumber + subkeyLength + context)
  }

  sodiumCryptoGenericHash(message, key) {
    return btoa(message + key)
  }

  sodiumCryptoSignVerify(message, signature, publicKey) {
    return true
  }

  sodiumCryptoBoxSeedKeypair(seed) {
    return {
      privateKey: seed,
      publicKey: seed,
    }
  }


  sodiumCryptoSignSeedKeypair(seed) {
    return {
      privateKey: seed,
      publicKey: seed,
    }
  }

  generateOtpSecret() {
    return 'WQVV2GFBRQWU3UQZWQFZC37PSNRXKTA6'
  }

  totpToken(secret, timestamp, tokenLength, step) {
    return '123456'
  }
}
