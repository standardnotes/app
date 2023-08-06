import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('device authentication', function () {
  beforeEach(async function () {
    localStorage.clear()
  })

  afterEach(async function () {
    localStorage.clear()
  })

  it('handles application launch with passcode only', async function () {
    const namespace = Factory.randomString()
    const application = await Factory.createAndInitializeApplication(namespace)
    const passcode = 'foobar'
    const wrongPasscode = 'barfoo'
    expect(await application.protections.createLaunchChallenge()).to.not.be.ok
    await application.addPasscode(passcode)
    expect(await application.hasPasscode()).to.equal(true)
    expect(await application.protections.createLaunchChallenge()).to.be.ok
    expect(application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.WrapperOnly)
    await Factory.safeDeinit(application)

    /** Recreate application and initialize */
    const tmpApplication = await Factory.createApplicationWithFakeCrypto(namespace)
    let numPasscodeAttempts = 0
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, numPasscodeAttempts < 2 ? wrongPasscode : passcode))
        }
      }
      return values
    }
    const receiveChallenge = async (challenge) => {
      tmpApplication.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          tmpApplication.submitValuesForChallenge(challenge, values)
          numPasscodeAttempts++
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      tmpApplication.submitValuesForChallenge(challenge, initialValues)
    }
    await tmpApplication.prepareForLaunch({ receiveChallenge })
    expect(await tmpApplication.encryption.getRootKey()).to.not.be.ok
    await tmpApplication.launch(true)
    expect(await tmpApplication.encryption.getRootKey()).to.be.ok
    expect(tmpApplication.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.WrapperOnly)
    await Factory.safeDeinit(tmpApplication)
  }).timeout(10000)

  it('handles application launch with passcode and biometrics', async function () {
    const namespace = Factory.randomString()
    const application = await Factory.createAndInitializeApplication(namespace)
    const passcode = 'foobar'
    const wrongPasscode = 'barfoo'
    await application.addPasscode(passcode)
    await application.protections.enableBiometrics()
    expect(await application.hasPasscode()).to.equal(true)
    expect((await application.protections.createLaunchChallenge()).prompts.length).to.equal(2)
    expect(application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.WrapperOnly)
    await Factory.safeDeinit(application)

    /** Recreate application and initialize */
    const tmpApplication = await Factory.createApplicationWithFakeCrypto(namespace)
    let numPasscodeAttempts = 1

    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          const response = { prompt, value: numPasscodeAttempts < 2 ? wrongPasscode : passcode }
          values.push(response)
        } else if (prompt.validation === ChallengeValidation.Biometric) {
          values.push({ prompt, value: true })
        }
      }
      return values
    }

    const receiveChallenge = async (challenge) => {
      tmpApplication.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          tmpApplication.submitValuesForChallenge(challenge, values)
          numPasscodeAttempts++
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      tmpApplication.submitValuesForChallenge(challenge, initialValues)
    }

    await tmpApplication.prepareForLaunch({ receiveChallenge })
    expect(await tmpApplication.encryption.getRootKey()).to.not.be.ok
    expect((await tmpApplication.protections.createLaunchChallenge()).prompts.length).to.equal(2)
    await tmpApplication.launch(true)
    expect(await tmpApplication.encryption.getRootKey()).to.be.ok
    expect(tmpApplication.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.WrapperOnly)
    await Factory.safeDeinit(tmpApplication)
  }).timeout(Factory.TwentySecondTimeout)

  it('handles application launch with passcode and account', async function () {
    const namespace = Factory.randomString()
    const application = await Factory.createAndInitializeApplication(namespace)
    const email = UuidGenerator.GenerateUuid()
    const password = UuidGenerator.GenerateUuid()
    await Factory.registerUserToApplication({
      application: application,
      email,
      password,
    })
    const sampleStorageKey = 'foo'
    const sampleStorageValue = 'bar'
    await application.storage.setValue(sampleStorageKey, sampleStorageValue)
    expect(application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyOnly)
    const passcode = 'foobar'
    Factory.handlePasswordChallenges(application, password)
    await application.addPasscode(passcode)
    expect(application.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyPlusWrapper)
    expect(await application.hasPasscode()).to.equal(true)
    await Factory.safeDeinit(application)

    const wrongPasscode = 'barfoo'
    let numPasscodeAttempts = 1
    /** Recreate application and initialize */
    const tmpApplication = await Factory.createApplicationWithFakeCrypto(namespace)
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push({ prompt, value: numPasscodeAttempts < 2 ? wrongPasscode : passcode })
        }
      }
      return values
    }
    const receiveChallenge = async (challenge) => {
      tmpApplication.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          tmpApplication.submitValuesForChallenge(challenge, values)
          numPasscodeAttempts++
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      tmpApplication.submitValuesForChallenge(challenge, initialValues)
    }
    await tmpApplication.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    expect(await tmpApplication.encryption.getRootKey()).to.not.be.ok
    await tmpApplication.launch(true)
    expect(await tmpApplication.storage.getValue(sampleStorageKey)).to.equal(sampleStorageValue)
    expect(await tmpApplication.encryption.getRootKey()).to.be.ok
    expect(tmpApplication.encryption.rootKeyManager.getKeyMode()).to.equal(KeyMode.RootKeyPlusWrapper)
    await Factory.safeDeinit(tmpApplication)
  }).timeout(Factory.TwentySecondTimeout)
})
