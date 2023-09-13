import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('001 protocol operations', () => {
  let application
  let protocol001

  let _identifier = 'hello@test.com'
  let _password = 'password'
  let _keyParams, _key

  beforeEach(async () => {
    localStorage.clear()

    application = Factory.createApplicationWithRealCrypto()
    protocol001 = new SNProtocolOperator001(new SNWebCrypto())

    await Factory.initializeApplication(application)

    _key = await protocol001.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    _keyParams = _key.keyParams
  })

  afterEach(async () => {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  it('generates random key', async () => {
    const length = 128
    const key = await protocol001.crypto.generateRandomKey(length)
    expect(key.length).to.equal(length / 4)
  })

  it('cost minimum', () => {
    expect(application.encryption.costMinimumForVersion('001')).to.equal(3000)
  })

  it('generates valid keys for registration', async () => {
    const key = await protocol001.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    expect(key.serverPassword).to.be.ok
    expect(key.masterKey).to.be.ok

    expect(key.keyParams.content.pw_nonce).to.be.ok
    expect(key.keyParams.content.pw_cost).to.be.ok
    expect(key.keyParams.content.pw_salt).to.be.ok
  })

  it('generates valid keys from existing params and decrypts', async () => {
    const password = 'password'
    const keyParams = await application.encryption.createKeyParams({
      pw_func: 'pbkdf2',
      pw_alg: 'sha512',
      pw_key_size: 512,
      pw_cost: 5000,
      pw_salt: '45cf889386d7ed72a0dcfb9d06fee9f6274ec0ce',
    })
    const key = await protocol001.computeRootKey(password, keyParams)
    expect(key.keyVersion).to.equal('001')
    expect(key.serverPassword).to.equal('8f2f0513e90648c08ef6fa55eda00bb76e82dfdc2e218e4338b6246e0f68eb78')
    expect(key.masterKey).to.equal('65e040f8ef6775fecbb7ee5599ec3f059faa96d728e50f2014237a802ac5bd0f')
    expect(key.dataAuthenticationKey).to.not.be.ok
    const payload = new EncryptedPayload({
      auth_hash: '0ae7e3c9fce61f07a8d5d267accab20793a06ab266c245fe59178d49c1ad3fa6',
      content:
        '001hEIgw837WzFM7Eb5tBHHXumxxKwaWuDv5hyhmrNDTUU5qxnb5jkjo1HsRzw+Z65BMuDqIdHlZU3plW+4QpJ6iFksFPYgo8VHa++dOtfAP7Q=',
      content_type: 'Note',
      enc_item_key:
        'sVuHmG0XAp1PRDE8r8XqFXijjP8Pqdwal9YFRrXK4hKLt1yyq8MwQU+1Z95Tz/b7ajYdidwFE0iDwd8Iu8281VtJsQ4yhh2tJiAzBy6newyHfhA5nH93yZ3iXRJaG87bgNQE9lsXzTV/OHAvqMuQtw/QVSWI3Qy1Pyu1Tn72q7FPKKhRRkzEEZ+Ax0BA1fHg',
      uuid: '54001a6f-7c22-4b34-8316-fadf9b1fc255',
    })
    const decrypted = await application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [payload],
        key: key,
      },
    })
    expect(decrypted.errorDecrypting).to.not.be.ok
    expect(decrypted.content.text).to.equal('Decryptable Sentence')
  })

  it('should decrypt string with case-insensitive uuid check for aad', async () => {
    /** If the server returns a lowercase uuid for the item, but the encrypted payload uses uppercase uuids, should still decrypt */
    const uppercaseUuid = '959B042A-3892-461E-8C50-477C10C7C40A'
    const lowercaseUuid = '959b042a-3892-461e-8c50-477c10c7c40a'

    const payload = new DecryptedPayload({
      uuid: uppercaseUuid,
      content_type: ContentType.TYPES.Note,
      content: FillItemContent({
        title: 'hello',
        text: 'world',
      }),
    })

    const key = await protocol001.createItemsKey()
    const params = await protocol001.generateEncryptedParametersAsync(payload, key)

    params.uuid = lowercaseUuid

    const decrypted = await protocol001.generateDecryptedParametersAsync(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })

  it('properly encrypts and decrypts', async () => {
    const text = 'hello world'
    const key = _key.masterKey
    const encString = await protocol001.encryptString(text, key)
    const decString = await protocol001.decryptString(encString, key)
    expect(decString).to.equal(text)
  })

  it('generates existing keys for key params', async () => {
    const key = await protocol001.computeRootKey(_password, _keyParams)
    expect(key.content).to.have.property('serverPassword')
    expect(key.content).to.have.property('masterKey')
    expect(key.compare(_key)).to.be.true
  })

  it('generating encryption params includes items_key_id', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol001.createItemsKey()
    const params = await protocol001.generateEncryptedParametersAsync(payload, key)
    expect(params.content).to.be.ok
    expect(params.enc_item_key).to.be.ok
    expect(params.auth_hash).to.be.ok
    expect(params.items_key_id).to.equal(key.uuid)
  })

  it('can decrypt encrypted params', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol001.createItemsKey()
    const params = await protocol001.generateEncryptedParametersAsync(payload, key)
    const decrypted = await protocol001.generateDecryptedParametersAsync(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })

  it('payloads missing enc_item_key should decrypt as errorDecrypting', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol001.createItemsKey()
    const params = await protocol001.generateEncryptedParametersAsync(payload, key)
    const modified = new EncryptedPayload({
      ...params,
      enc_item_key: undefined,
    })
    const decrypted = await protocol001.generateDecryptedParametersAsync(modified, key)
    expect(decrypted.errorDecrypting).to.equal(true)
  })
})
