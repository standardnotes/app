import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('002 protocol operations', () => {
  let _identifier = 'hello@test.com'
  let _password = 'password'
  let _keyParams, _key
  let application
  let protocol002

  beforeEach(async () => {
    localStorage.clear()

    application = Factory.createApplicationWithRealCrypto()
    protocol002 = new SNProtocolOperator002(new SNWebCrypto())

    await Factory.initializeApplication(application)
    _key = await protocol002.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    _keyParams = _key.keyParams
  })

  afterEach(async () => {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  it('generates random key', async () => {
    const length = 128
    const key = await protocol002.crypto.generateRandomKey(length)
    expect(key.length).to.equal(length / 4)
  })

  it('cost minimum', () => {
    expect(application.encryption.costMinimumForVersion('002')).to.equal(3000)
  })

  it('generates valid keys for registration', async () => {
    const key = await protocol002.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    expect(key.dataAuthenticationKey).to.be.ok
    expect(key.serverPassword).to.be.ok
    expect(key.masterKey).to.be.ok

    expect(key.keyParams.content.pw_nonce).to.be.ok
    expect(key.keyParams.content.pw_cost).to.be.ok
    expect(key.keyParams.content.pw_salt).to.be.ok
  })

  it('generates valid keys from existing params and decrypts', async () => {
    const password = 'password'
    const keyParams = await application.encryption.createKeyParams({
      pw_salt: '8d381ef44cdeab1489194f87066b747b46053a833ee24956e846e7b40440f5f4',
      pw_cost: 101000,
      version: '002',
    })
    const key = await protocol002.computeRootKey(password, keyParams)
    expect(key.keyVersion).to.equal('002')
    expect(key.serverPassword).to.equal('f3cc7efc93380a7a3765dcb0498dabe83387acdda78f43bc7cfc31f4a2a05077')
    expect(key.masterKey).to.equal('66500f7c9fb8ba0843e13e2f555feb5e43a3c27fee23e9b900a2577f1b373e1a')
    expect(key.dataAuthenticationKey).to.equal('af3d6a7fd6c0422a7a84b0e99d6ac2a79b77675c9848f74314c20046e1f95c75')
    const payload = new EncryptedPayload({
      content:
        '002:0ff292a79549e817003886e9c4865eaf5faa0b3ada5b41c846c63bd4056e6816:959b042a-3892-461e-8c50-477c10c7c40a:c856f9d81033994f397285e2d060e9d4:pQ/jKyb8qCsz18jdMiYkpxf4l8ELIbTtwqUwLM3fRUwDL4/ofZLGICuFlssmrb74Brm+N19znwfNQ9ouFPtijA==',
      content_type: 'Note',
      enc_item_key:
        '002:24a8e8f7728bbe06605d8209d87ad338d3d15ef81154bb64d3967c77daa01333:959b042a-3892-461e-8c50-477c10c7c40a:f1d294388742dca34f6f266a01483a4e:VdlEDyjhZ35GbJDg8ruSZv3Tp6WtMME3T5LLvcBYLHIMhrMi0RlPK83lK6F0aEaZvY82pZ0ntU+XpAX7JMSEdKdPXsACML7WeFrqKb3z2qHnA7NxgnIC0yVT/Z2mRrvlY3NNrUPGwJbfRcvfS7FVyw87MemT9CSubMZRviXvXETx82t7rsgjV/AIwOOeWhFi',
      uuid: '959b042a-3892-461e-8c50-477c10c7c40a',
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

    const key = await protocol002.createItemsKey()
    const params = await protocol002.generateEncryptedParametersAsync(payload, key)

    params.uuid = lowercaseUuid

    const decrypted = await protocol002.generateDecryptedParametersAsync(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })

  it('properly encrypts and decrypts strings', async () => {
    const text = 'hello world'
    const key = _key.masterKey
    const iv = await protocol002.crypto.generateRandomKey(128)
    const encString = await protocol002.encryptString002(text, key, iv)
    const decString = await protocol002.decryptString002(encString, key, iv)
    expect(decString).to.equal(text)
  })

  it('generates existing keys for key params', async () => {
    const key = await protocol002.computeRootKey(_password, _keyParams)
    expect(key.compare(_key)).to.be.true
  })

  it('generating encryption params includes items_key_id', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol002.createItemsKey()
    const params = await protocol002.generateEncryptedParametersAsync(payload, key)
    expect(params.content).to.be.ok
    expect(params.enc_item_key).to.be.ok
    expect(params.items_key_id).to.equal(key.uuid)
  })

  it('can decrypt encrypted params', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol002.createItemsKey()
    const params = await protocol002.generateEncryptedParametersAsync(payload, key)

    const decrypted = await protocol002.generateDecryptedParametersAsync(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })

  it('payloads missing enc_item_key should decrypt as errorDecrypting', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol002.createItemsKey()
    const params = await protocol002.generateEncryptedParametersAsync(payload, key)
    const modified = new EncryptedPayload({
      ...params,
      enc_item_key: undefined,
    })
    const decrypted = await protocol002.generateDecryptedParametersAsync(modified, key)
    expect(decrypted.errorDecrypting).to.equal(true)
  })
})
