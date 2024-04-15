import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

const accountPassword = 'password'

const registerApp = async (application) => {
  const email = UuidGenerator.GenerateUuid()
  const password = accountPassword
  const ephemeral = false
  const mergeLocal = true

  await application.register(email, password, null, ephemeral, mergeLocal)
  return application
}

describe('mfa service', () => {
  let application

  beforeEach(async () => {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto(Environment.Web, Platform.MacWeb)
  })

  afterEach(async () => {
    Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
    sinon.restore()
  })

  it('generates 160 bit base32-encoded mfa secret', async () => {
    const RFC4648 = /[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]/g

    const secret = await application.mfa.generateMfaSecret()
    expect(secret).to.have.lengthOf(32)
    expect(secret.replace(RFC4648, '')).to.have.lengthOf(0)
  })

  it('activates mfa, checks if enabled, deactivates mfa', async () => {
    await registerApp(application)

    Factory.handlePasswordChallenges(application, accountPassword)

    expect(await application.mfa.isMfaActivated()).to.equal(false)

    const secret = await application.mfa.generateMfaSecret()
    const token = await application.mfa.getOtpToken(secret)

    await application.mfa.enableMfa(secret, token)

    expect(await application.mfa.isMfaActivated()).to.equal(true)

    await application.mfa.disableMfa()

    expect(await application.mfa.isMfaActivated()).to.equal(false)
  }).timeout(Factory.TenSecondTimeout)

  it('prompts for account password when disabling mfa', async () => {
    await registerApp(application)

    Factory.handlePasswordChallenges(application, accountPassword)
    const secret = await application.mfa.generateMfaSecret()
    const token = await application.mfa.getOtpToken(secret)

    sinon.spy(application.challenges, 'sendChallenge')
    await application.mfa.enableMfa(secret, token)
    await application.mfa.disableMfa()

    const spyCall = application.challenges.sendChallenge.getCall(0)
    const challenge = spyCall.firstArg
    expect(challenge.prompts).to.have.lengthOf(2)
    expect(challenge.prompts[0].validation).to.equal(ChallengeValidation.AccountPassword)
  }).timeout(Factory.TenSecondTimeout)
})
