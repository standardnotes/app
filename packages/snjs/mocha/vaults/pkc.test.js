import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('public key cryptography', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  beforeEach(async () => {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async () => {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
    context = undefined
  })

  it('should create keypair during registration', () => {
    expect(context.publicKey).to.not.be.undefined
    expect(context.keyPair.privateKey).to.not.be.undefined

    expect(context.signingPublicKey).to.not.be.undefined
    expect(context.signingKeyPair.privateKey).to.not.be.undefined
  })

  it('should populate keypair during sign in', async () => {
    const email = context.email
    const password = context.password
    await context.deinit()

    const recreatedContext = await Factory.createVaultsContextWithRealCrypto()
    await recreatedContext.launch()
    recreatedContext.email = email
    recreatedContext.password = password
    await recreatedContext.signIn()

    expect(recreatedContext.publicKey).to.not.be.undefined
    expect(recreatedContext.privateKey).to.not.be.undefined

    expect(recreatedContext.signingPublicKey).to.not.be.undefined
    expect(recreatedContext.signingKeyPair.privateKey).to.not.be.undefined

    await recreatedContext.deinit()
  })

  it('should rotate keypair during password change', async () => {
    const oldPublicKey = context.publicKey
    const oldPrivateKey = context.privateKey

    const oldSigningPublicKey = context.signingPublicKey
    const oldSigningPrivateKey = context.signingKeyPair.privateKey

    await context.changePassword('new_password')

    expect(context.publicKey).to.not.be.undefined
    expect(context.keyPair.privateKey).to.not.be.undefined
    expect(context.publicKey).to.not.equal(oldPublicKey)
    expect(context.keyPair.privateKey).to.not.equal(oldPrivateKey)

    expect(context.signingPublicKey).to.not.be.undefined
    expect(context.signingKeyPair.privateKey).to.not.be.undefined
    expect(context.signingPublicKey).to.not.equal(oldSigningPublicKey)
    expect(context.signingKeyPair.privateKey).to.not.equal(oldSigningPrivateKey)
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
