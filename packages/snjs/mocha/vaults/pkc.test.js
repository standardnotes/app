import * as Factory from '../lib/factory.js'

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

    context = await Factory.createVaultsContextWithRealCrypto()

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

    const recreatedContext = await Factory.createVaultsContextWithRealCrypto()
    await recreatedContext.launch()
    recreatedContext.email = email
    recreatedContext.password = password
    await recreatedContext.signIn()

    expect(recreatedContext.sessions.getPublicKey()).to.not.be.undefined
    expect(recreatedContext.getKeyPair().privateKey).to.not.be.undefined

    expect(recreatedContext.sessions.getSigningPublicKey()).to.not.be.undefined
    expect(recreatedContext.getSigningKeyPair().privateKey).to.not.be.undefined

    await recreatedContext.deinit()
  })

  it('should rotate keypair during password change', async () => {
    const oldPublicKey = sessions.getPublicKey()
    const oldPrivateKey = encryption.getKeyPair().privateKey

    const oldSigningPublicKey = sessions.getSigningPublicKey()
    const oldSigningPrivateKey = encryption.getSigningKeyPair().privateKey

    await context.changePassword('new_password')

    expect(sessions.getPublicKey()).to.not.be.undefined
    expect(context.getKeyPair().privateKey).to.not.be.undefined
    expect(sessions.getPublicKey()).to.not.equal(oldPublicKey)
    expect(context.getKeyPair().privateKey).to.not.equal(oldPrivateKey)

    expect(sessions.getSigningPublicKey()).to.not.be.undefined
    expect(context.getSigningKeyPair().privateKey).to.not.be.undefined
    expect(sessions.getSigningPublicKey()).to.not.equal(oldSigningPublicKey)
    expect(context.getSigningKeyPair().privateKey).to.not.equal(oldSigningPrivateKey)
  })

  it('should allow option to enable collaboration for previously signed in accounts', async () => {
    const newContext = await Factory.createVaultsContextWithRealCrypto()
    await newContext.launch()

    await newContext.register()

    const rootKey = await newContext.encryption.getRootKey()
    const mutatedRootKey = CreateNewRootKey({
      ...rootKey.content,
      encryptionKeyPair: undefined,
      signingKeyPair: undefined,
    })

    await newContext.encryption.setRootKey(mutatedRootKey)

    expect(newContext.application.sessions.isUserMissingKeyPair()).to.be.true

    const result = await newContext.application.user.updateAccountWithFirstTimeKeyPair()
    expect(result.error).to.be.undefined

    expect(newContext.application.sessions.isUserMissingKeyPair()).to.be.false

    await newContext.deinit()
  })
})
