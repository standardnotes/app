import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('004 protocol operations', function () {
  let _identifier = 'hello@test.com'
  let _password = 'password'
  let rootKeyParams
  let rootKey

  let application
  let protocol004

  beforeEach(async function () {
    localStorage.clear()

    application = Factory.createApplicationWithRealCrypto()
    protocol004 = new SNProtocolOperator004(new SNWebCrypto())

    await Factory.initializeApplication(application)

    rootKey = await protocol004.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    rootKeyParams = rootKey.keyParams
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = undefined
    localStorage.clear()
  })

  it('cost minimum should throw', function () {
    expect(function () {
      application.encryption.costMinimumForVersion('004')
    }).to.throw('Cost minimums only apply to versions <= 002')
  })

  it('generates valid keys for registration', async function () {
    const key = await application.encryption.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)

    expect(key.masterKey).to.be.ok

    expect(key.serverPassword).to.be.ok
    expect(key.mk).to.not.be.ok
    expect(key.dataAuthenticationKey).to.not.be.ok

    expect(key.keyParams.content004.pw_nonce).to.be.ok
    expect(key.keyParams.content004.pw_cost).to.not.be.ok
    expect(key.keyParams.content004.salt).to.not.be.ok
    expect(key.keyParams.content004.identifier).to.be.ok
  })

  it('computes proper keys for sign in', async function () {
    const identifier = 'foo@bar.com'
    const password = 'very_secure'
    const keyParams = application.encryption.createKeyParams({
      pw_nonce: 'baaec0131d677cf993381367eb082fe377cefe70118c1699cb9b38f0bc850e7b',
      identifier: identifier,
      version: '004',
    })
    const key = await protocol004.computeRootKey(password, keyParams)
    expect(key.masterKey).to.equal('5d68e78b56d454e32e1f5dbf4c4e7cf25d74dc1efc942e7c9dfce572c1f3b943')
    expect(key.serverPassword).to.equal('83707dfc837b3fe52b317be367d3ed8e14e903b2902760884fd0246a77c2299d')
    expect(key.dataAuthenticationKey).to.not.be.ok
  })

  it('generates random key', async function () {
    const length = 96
    const key = await application.encryption.crypto.generateRandomKey(length)
    expect(key.length).to.equal(length / 4)
  })

  it('properly encrypts and decrypts', async function () {
    const payload = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.ItemsKey,
      content: FillItemContent({
        title: 'foo',
        text: 'bar',
      }),
    })

    const operator = application.dependencies.get(TYPES.EncryptionOperators).operatorForVersion(ProtocolVersion.V004)

    const encrypted = await operator.generateEncryptedParameters(payload, rootKey)
    const decrypted = await operator.generateDecryptedParameters(encrypted, rootKey)

    expect(decrypted.content.title).to.equal('foo')
    expect(decrypted.content.text).to.equal('bar')
  })

  it('fails to decrypt non-matching aad', async function () {
    const payload = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.ItemsKey,
      content: FillItemContent({
        title: 'foo',
        text: 'bar',
      }),
    })

    const operator = application.dependencies.get(TYPES.EncryptionOperators).operatorForVersion(ProtocolVersion.V004)

    const encrypted = await operator.generateEncryptedParameters(payload, rootKey)
    const decrypted = await operator.generateDecryptedParameters(
      {
        ...encrypted,
        uuid: 'nonmatching',
      },
      rootKey,
    )

    expect(decrypted.errorDecrypting).to.equal(true)
  })

  it('generates existing keys for key params', async function () {
    const key = await application.encryption.computeRootKey(_password, rootKeyParams)
    expect(key.compare(rootKey)).to.be.true
  })

  it('can decrypt encrypted params', async function () {
    const payload = Factory.createNotePayload()
    const key = await protocol004.createItemsKey()
    const params = await protocol004.generateEncryptedParameters(payload, key)
    const decrypted = await protocol004.generateDecryptedParameters(params, key)
    expect(decrypted.errorDecrypting).to.not.be.ok
    expect(decrypted.content).to.eql(payload.content)
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

    const key = await protocol004.createItemsKey()
    const params = await protocol004.generateEncryptedParameters(payload, key)

    params.uuid = lowercaseUuid

    const decrypted = await protocol004.generateDecryptedParameters(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })

  it('modifying the uuid of the payload should fail to decrypt', async function () {
    const payload = Factory.createNotePayload()
    const key = await protocol004.createItemsKey()
    const params = await protocol004.generateEncryptedParameters(payload, key)
    params.uuid = 'foo'
    const result = await protocol004.generateDecryptedParameters(params, key)
    expect(result.errorDecrypting).to.equal(true)
  })
})
