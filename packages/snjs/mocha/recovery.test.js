import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('account recovery', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  let application
  let context

  beforeEach(async function () {
    localStorage.clear()
    context = await Factory.createAppContextWithFakeCrypto()

    await context.launch()

    application = context.application

    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  it('should get the same recovery codes at each consecutive call', async () => {
    let recoveryCodesSetting = await application.settings.getSetting(SettingName.RecoveryCodes)
    expect(recoveryCodesSetting).to.equal(undefined)

    const generatedRecoveryCodesAfterFirstCall = await application.getRecoveryCodes.execute()
    expect(generatedRecoveryCodesAfterFirstCall.getValue().length).to.equal(49)

    recoveryCodesSetting = await application.settings.getSetting(SettingName.RecoveryCodes)
    expect(recoveryCodesSetting).to.equal(generatedRecoveryCodesAfterFirstCall.getValue())

    const fetchedRecoveryCodesOnTheSecondCall = await application.getRecoveryCodes.execute()
    expect(generatedRecoveryCodesAfterFirstCall.getValue()).to.equal(fetchedRecoveryCodesOnTheSecondCall.getValue())
  })

  it.only('should allow to sign in with recovery codes', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    application = await Factory.signOutApplicationAndReturnNew(application)

    expect(await application.protocolService.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.paswword,
    })

    expect(await application.protocolService.getRootKey()).to.be.ok
  })

  it('should automatically generate new recovery codes after recovery sign in', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    await application.user.signOut()

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.paswword,
    })

    const recoveryCodesAfterRecoverySignIn = await application.getRecoveryCodes.execute()
    expect(recoveryCodesAfterRecoverySignIn.getValue()).not.to.equal(generatedRecoveryCodes.getValue())
  })

  it('should disable MFA after recovery sign in', async () => {
    const secret = await application.generateMfaSecret()
    const token = await application.getOtpToken(secret)

    await application.enableMfa(secret, token)

    expect(await application.isMfaActivated()).to.equal(true)

    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    await application.user.signOut()

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: context.paswword,
    })

    expect(await application.isMfaActivated()).to.equal(false)
  })

  it('should not allow to sign in with recovery codes and invalid credentials', async () => {
    const generatedRecoveryCodes = await application.getRecoveryCodes.execute()

    await application.user.signOut()

    expect(await application.protocolService.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: generatedRecoveryCodes.getValue(),
      username: context.email,
      password: 'foobar',
    })

    expect(await application.protocolService.getRootKey()).to.not.be.ok
  })

  it('should not allow to sign in with invalid recovery codes', async () => {
    await application.getRecoveryCodes.execute()

    await application.user.signOut()

    expect(await application.protocolService.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: 'invalid recovery codes',
      username: context.email,
      password: context.paswword,
    })

    expect(await application.protocolService.getRootKey()).to.not.be.ok
  })

  it('should not allow to sign in with recovery codes if user has none', async () => {
    await application.user.signOut()

    expect(await application.protocolService.getRootKey()).to.not.be.ok

    await application.signInWithRecoveryCodes.execute({
      recoveryCodes: 'foo bar',
      username: context.email,
      password: context.paswword,
    })

    expect(await application.protocolService.getRootKey()).to.not.be.ok
  })
})
