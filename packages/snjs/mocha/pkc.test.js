import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('public key cryptography', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let sessions
  let encryption

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    sessions = context.application.sessions
    encryption = context.encryption
  })

  it('should create keypair during registration', () => {
    expect(sessions.getPublicKey()).to.not.be.undefined
    expect(encryption.getKeyPair().privateKey).to.not.be.undefined

    expect(sessions.getSigningPublicKey()).to.not.be.undefined
    expect(encryption.getSigningKeyPair().privateKey).to.not.be.undefined
  })

  it('should populate keypair during sign in', async () => {
    const email = context.email
    const password = context.password
    await context.signout()

    const recreatedContext = await Factory.createAppContextWithRealCrypto()
    await recreatedContext.launch()
    recreatedContext.email = email
    recreatedContext.password = password
    await recreatedContext.signIn()

    expect(recreatedContext.sessions.getPublicKey()).to.not.be.undefined
    expect(recreatedContext.encryption.getKeyPair().privateKey).to.not.be.undefined

    expect(recreatedContext.sessions.getSigningPublicKey()).to.not.be.undefined
    expect(recreatedContext.encryption.getSigningKeyPair().privateKey).to.not.be.undefined
  })

  it('should rotate keypair during password change', async () => {
    const oldPublicKey = sessions.getPublicKey()
    const oldPrivateKey = encryption.getKeyPair().privateKey

    const oldSigningPublicKey = sessions.getSigningPublicKey()
    const oldSigningPrivateKey = encryption.getSigningKeyPair().privateKey

    await context.changePassword('new_password')

    expect(sessions.getPublicKey()).to.not.be.undefined
    expect(encryption.getKeyPair().privateKey).to.not.be.undefined
    expect(sessions.getPublicKey()).to.not.equal(oldPublicKey)
    expect(encryption.getKeyPair().privateKey).to.not.equal(oldPrivateKey)

    expect(sessions.getSigningPublicKey()).to.not.be.undefined
    expect(encryption.getSigningKeyPair().privateKey).to.not.be.undefined
    expect(sessions.getSigningPublicKey()).to.not.equal(oldSigningPublicKey)
    expect(encryption.getSigningKeyPair().privateKey).to.not.equal(oldSigningPrivateKey)
  })

  it('should reupload public keys when changing my password', async () => {
    const oldEncryptedPrivateKey = context.userEncryptedPrivateKey
    const oldEncryptedSigningPrivateKey = context.userEncryptedSigningPrivateKey

    expect(oldEncryptedPrivateKey).to.not.be.undefined
    expect(oldEncryptedSigningPrivateKey).to.not.be.undefined

    await context.changePassword('new_password')

    const user = await context.application.sessions.getUserFromServer()

    expect(user.public_key).to.not.be.undefined
    expect(user.public_key).to.not.equal(oldEncryptedPrivateKey)

    expect(user.signing_public_key).to.not.be.undefined
    expect(user.signing_public_key).to.not.equal(oldEncryptedSigningPrivateKey)
  })

  it('should allow option to enable collaboration for previously signed in accounts', async () => {
    const newContext = await Factory.createAppContextWithRealCrypto()
    await newContext.launch()

    const objectToSpy = newContext.application.sessions.userApiService

    sinon.stub(objectToSpy, 'register').callsFake(async (params) => {
      const modifiedParams = {
        ...params,
        publicKey: undefined,
        encryptedPrivateKey: undefined,
        signingPublicKey: undefined,
        encryptedSigningPrivateKey: undefined,
      }

      objectToSpy.register.restore()
      const result = await objectToSpy.register(modifiedParams)
      return result
    })

    await newContext.register()

    expect(newContext.application.sessions.isUserMissingKeyPair()).to.be.true

    await newContext.application.user.updateAccountWithFirstTimeKeyPair()

    expect(newContext.application.sessions.isUserMissingKeyPair()).to.be.false
  })
})
