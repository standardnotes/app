import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('003 protocol operations', () => {
  let _identifier = 'hello@test.com'
  let _password = 'password'
  let _keyParams, _key

  let application
  let protocol003

  beforeEach(async () => {
    localStorage.clear()

    application = Factory.createApplicationWithRealCrypto()
    protocol003 = new SNProtocolOperator003(new SNWebCrypto())

    await Factory.initializeApplication(application)
    _key = await protocol003.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)
    _keyParams = _key.keyParams
  })

  afterEach(async () => {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  it('generates random key', async () => {
    const length = 128
    const key = await protocol003.crypto.generateRandomKey(length)
    expect(key.length).to.equal(length / 4)
  })

  it('cost minimum should throw', () => {
    expect(() => {
      application.encryption.costMinimumForVersion('003')
    }).to.throw('Cost minimums only apply to versions <= 002')
  })

  it('generates valid keys for registration', async () => {
    const key = await protocol003.createRootKey(_identifier, _password, KeyParamsOrigination.Registration)

    expect(key.dataAuthenticationKey).to.be.ok
    expect(key.serverPassword).to.be.ok
    expect(key.masterKey).to.be.ok

    expect(key.keyParams.content.pw_nonce).to.be.ok
    expect(key.keyParams.content.pw_cost).to.not.be.ok
    expect(key.keyParams.content.pw_salt).to.not.be.ok
    expect(key.keyParams.content.identifier).to.be.ok
  })

  it('computes proper keys for sign in', async () => {
    const identifier = 'foo@bar.com'
    const password = 'very_secure'
    const keyParams = application.encryption.createKeyParams({
      pw_nonce: 'baaec0131d677cf993381367eb082fe377cefe70118c1699cb9b38f0bc850e7b',
      identifier: identifier,
      version: '003',
    })
    const key = await protocol003.computeRootKey(password, keyParams)
    expect(key.serverPassword).to.equal('60fdae231049d81974c562e943ad472f0143daa87f43048d2ede2d199ea7be25')
    expect(key.masterKey).to.equal('2b2162e5299f71f9fcd39789a01f6062f2779220e97a43d7895cf30da11186e9')
    expect(key.dataAuthenticationKey).to.equal('24dfba6f42ffc07a5223440a28a574d463e99d8d4aeb68fe95f55aa8ed5fd39f')
  })

  it('can decrypt item generated with web version 3.3.6', async () => {
    const identifier = 'demo@standardnotes.org'
    const password = 'password'
    const keyParams = application.encryption.createKeyParams({
      pw_nonce: '31107837b44d86179140b7c602a55d694243e2e9ced0c4c914ac21ad90215055',
      identifier: identifier,
      version: '003',
    })
    const key = await protocol003.computeRootKey(password, keyParams)
    const payload = new EncryptedPayload({
      uuid: '80488ade-933a-4570-8852-5282a094fafc',
      content_type: 'Note',
      enc_item_key:
        '003:f385f1af03c6e16844ba685b0766a93f65c6e1813c56146376994188c40902ef:80488ade-933a-4570-8852-5282a094fafc:8af48228d965847a3fb7904e801f3958:xM1UKtXEpXytu0amQ405rpJ8KvTcNNjqNcZEWfhefZQo+25cZfNgFRniZuO2ysXyR4qWiLQlWb5pptQi1gSNakOmCNl7WiQgH7t7ia7gwz667i6nrrwVJ8vauXeyTzspr4J/NHa1LM/f8/MDxiHWVG7MvXkWqGT7qBCzcY1BXXQaMlf6g1VEDq+INPnzSZG/:eyJpZGVudGlmaWVyIjoiZGVtb0BzdGFuZGFyZG5vdGVzLm9yZyIsInB3X2Nvc3QiOjExMDAwMCwicHdfbm9uY2UiOiIzMTEwNzgzN2I0NGQ4NjE3OTE0MGI3YzYwMmE1NWQ2OTQyNDNlMmU5Y2VkMGM0YzkxNGFjMjFhZDkwMjE1MDU1IiwidmVyc2lvbiI6IjAwMyJ9',
      content:
        '003:ca505a223d3ef3ad5cd4e6f4e0d06a2bb34b8b032f60180165c37acd5a4718e3:80488ade-933a-4570-8852-5282a094fafc:bad25bb4ba935646148fe7f118c5f60d:g+eHtGG+M4ZdIevpx9xkK9mmFYo8/1JTlaDysM18nGrA3Oe3wvFTfG5PPvH50uY6PgBbWZPS+BNpsH/gVMH8T9LCreRLPVw5yRhunyva0pgsk/k4Dmi4PTsvvNqhA2F8X2LZTwuw7QlLkvOneX9cNmNDzVGmsedSWhEZXbD5jmb1Ev77Gq1kjqh2eFc7lPa/WBb52fs8FHKbO9HUGqXF49/JOunpvp76/bAydavGQ2n/abkGCoYvrtmyM1lqthBb8w60KidkC/Hm4cGAm8wNKyg58YUHCYPAlaUI0DxPGXu24Ur/6M7HdP/9puitJGUSlXA32DXABMd8DbUk6JPvJRKvQ/v4Dd3UR0h7Gdm/YME=:eyJpZGVudGlmaWVyIjoiZGVtb0BzdGFuZGFyZG5vdGVzLm9yZyIsInB3X2Nvc3QiOjExMDAwMCwicHdfbm9uY2UiOiIzMTEwNzgzN2I0NGQ4NjE3OTE0MGI3YzYwMmE1NWQ2OTQyNDNlMmU5Y2VkMGM0YzkxNGFjMjFhZDkwMjE1MDU1IiwidmVyc2lvbiI6IjAwMyJ9',
    })
    const decrypted = await protocol003.generateDecryptedParametersAsync(payload, key)
    expect(decrypted.content.title).to.equal('Secret key')
    expect(decrypted.content.text).to.equal('TaW8uq4cZRCNf3e4L8c7xFhsJkJdt6')
  })

  it('properly encrypts and decrypts', async () => {
    const text = 'hello world'
    const rawKey = _key.masterKey
    const iv = await protocol003.crypto.generateRandomKey(128)
    const encString = await protocol003.encryptString002(text, rawKey, iv)
    const decString = await protocol003.decryptString002(encString, rawKey, iv)
    expect(decString).to.equal(text)
  })

  it('generates existing keys for key params', async () => {
    const key = await protocol003.computeRootKey(_password, _keyParams)
    expect(key.compare(_key)).to.be.true
  })

  it('generating encryption params includes items_key_id', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol003.createItemsKey()
    const params = await protocol003.generateEncryptedParametersAsync(payload, key)
    expect(params.content).to.be.ok
    expect(params.enc_item_key).to.be.ok
    expect(params.items_key_id).to.equal(key.uuid)
  })

  it('can decrypt encrypted params', async () => {
    const payload = Factory.createNotePayload()
    const key = await protocol003.createItemsKey()
    const params = await protocol003.generateEncryptedParametersAsync(payload, key)
    const decrypted = await protocol003.generateDecryptedParametersAsync(params, key)
    expect(decrypted.content).to.eql(payload.content)
  })
})
