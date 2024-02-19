import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('account recovery', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  let application
  let context

  beforeEach(async function () {
    localStorage.clear()
    context = await Factory.createAppContextWithFakeCrypto()

    await context.launch()

    application = context.application

    await context.register()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  it('should get the same recovery code at each consecutive call', async () => {
    let recoveryCodesSetting = await application.settings.getSetting(SettingName.create(SettingName.NAMES.RecoveryCodes).getValue())
    expect(recoveryCodesSetting).to.equal(undefined)

    const generatedRecoveryCodesAfterFirstCall = await application.getRecoveryCodes.execute()
    expect(generatedRecoveryCodesAfterFirstCall.getValue().length).to.equal(49)

    recoveryCodesSetting = await application.settings.getSetting(SettingName.create(SettingName.NAMES.RecoveryCodes).getValue())
    expect(recoveryCodesSetting).to.equal(generatedRecoveryCodesAfterFirstCall.getValue())

    const fetchedRecoveryCodesOnTheSecondCall = await application.getRecoveryCodes.execute()
    expect(generatedRecoveryCodesAfterFirstCall.getValue()).to.equal(fetchedRecoveryCodesOnTheSecondCall.getValue())
  })

  it('should allow to sign in with recovery code', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    application = await context.signout()

    expect(await application.encryption.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.password,
    })

    expect(await application.encryption.getRootKey()).to.be.ok
  })

  it('should automatically generate new recovery code after recovery sign in', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    application = await context.signout()

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.password,
    })

    const recoveryCodesAfterRecoverySignIn = await application.getRecoveryCodes.execute()
    expect(recoveryCodesAfterRecoverySignIn.getValue()).not.to.equal(generatedRecoveryCodes.getValue())
  })

  it('should disable MFA after recovery sign in', async () => {
    const secret = await application.mfa.generateMfaSecret()
    const token = await application.mfa.getOtpToken(secret)

    await application.mfa.enableMfa(secret, token)

    expect(await application.mfa.isMfaActivated()).to.equal(true)

    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    application = await context.signout()

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.password,
    })

    expect(await application.mfa.isMfaActivated()).to.equal(false)
  })

  it('should not allow to sign in with recovery code and invalid credentials', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    application = await context.signout()

    expect(await application.encryption.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: 'foobar',
    })

    expect(await application.encryption.getRootKey()).to.not.be.ok
  })

  it('should not allow to sign in with invalid recovery code', async () => {
    await application.getRecoveryCodes.execute()

    application = await context.signout()

    expect(await application.encryption.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: 'invalid recovery code',
      username: context.email,
      password: context.paswword,
    })

    expect(await application.encryption.getRootKey()).to.not.be.ok
  })

  it('should not allow to sign in with recovery code if user has none', async () => {
    application = await context.signout()

    expect(await application.encryption.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: 'foo bar',
      username: context.email,
      password: context.paswword,
    })

    expect(await application.encryption.getRootKey()).to.not.be.ok
  })
})
