import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

const createApp = async () => Factory.createInitAppWithFakeCrypto(Environment.Web, Platform.MacWeb)

const accountPassword = 'password'

const registerApp = async (snApp) => {
  const email = UuidGenerator.GenerateUuid()
  const password = accountPassword
  const ephemeral = false
  const mergeLocal = true

  await snApp.register(email, password, ephemeral, mergeLocal)
  return snApp
}

describe('mfa service', () => {
  it('generates 160 bit base32-encoded mfa secret', async () => {
    const RFC4648 = /[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]/g

    const snApp = await createApp()
    const secret = await snApp.generateMfaSecret()
    expect(secret).to.have.lengthOf(32)
    expect(secret.replace(RFC4648, '')).to.have.lengthOf(0)

    Factory.safeDeinit(snApp)
  })

  it('activates mfa, checks if enabled, deactivates mfa', async () => {
    const snApp = await createApp().then(registerApp)
    Factory.handlePasswordChallenges(snApp, accountPassword)

    expect(await snApp.isMfaActivated()).to.equal(false)

    const secret = await snApp.generateMfaSecret()
    const token = await snApp.getOtpToken(secret)

    await snApp.enableMfa(secret, token)

    expect(await snApp.isMfaActivated()).to.equal(true)

    await snApp.disableMfa()

    expect(await snApp.isMfaActivated()).to.equal(false)

    Factory.safeDeinit(snApp)
  }).timeout(Factory.TenSecondTimeout)

  it('prompts for account password when disabling mfa', async () => {
    const snApp = await createApp().then(registerApp)
    Factory.handlePasswordChallenges(snApp, accountPassword)
    const secret = await snApp.generateMfaSecret()
    const token = await snApp.getOtpToken(secret)

    sinon.spy(snApp.challengeService, 'sendChallenge')
    await snApp.enableMfa(secret, token)
    await snApp.disableMfa()

    const spyCall = snApp.challengeService.sendChallenge.getCall(0)
    const challenge = spyCall.firstArg
    expect(challenge.prompts).to.have.lengthOf(2)
    expect(challenge.prompts[0].validation).to.equal(ChallengeValidation.AccountPassword)

    Factory.safeDeinit(snApp)
  }).timeout(Factory.TenSecondTimeout)
})
