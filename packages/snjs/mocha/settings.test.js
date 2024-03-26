import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'
import * as Events from './lib/Events.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('settings service', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  const validSetting = SettingName.create(SettingName.NAMES.GoogleDriveBackupFrequency).getValue()
  const fakePayload = 'Im so meta even this acronym'
  const updatedFakePayload = 'is meta'

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

  const reInitializeApplicationWithRealCrypto = async () => {
    await Factory.safeDeinit(application)

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()

    application = context.application

    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })
  }

  it('creates and reads a setting', async function () {
    await application.settings.updateSetting(validSetting, fakePayload)
    const responseCreate = await application.settings.getSetting(validSetting)
    expect(responseCreate).to.equal(fakePayload)
  })

  it('throws error on an invalid setting update', async function () {
    const invalidSetting = 'FAKE_SETTING'
    let caughtError = undefined
    try {
      await application.settings.updateSetting(invalidSetting, fakePayload)
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).not.to.equal(undefined)
  })

  it('creates and lists settings', async function () {
    await application.settings.updateSetting(validSetting, fakePayload)
    const responseList = await application.settings.listSettings()
    expect(responseList.getSettingValue(validSetting)).to.eql(fakePayload)
  })

  it('creates and deletes a setting', async function () {
    await application.settings.updateSetting(validSetting, fakePayload)
    const responseCreate = await application.settings.getSetting(validSetting)
    expect(responseCreate).to.eql(fakePayload)

    await application.settings.deleteSetting(validSetting)
    const responseDeleted = await application.settings.listSettings()
    expect(responseDeleted.getSettingValue(validSetting)).to.not.be.ok
  })

  it('creates and updates a setting', async function () {
    await application.settings.updateSetting(validSetting, fakePayload)
    await application.settings.updateSetting(validSetting, updatedFakePayload)
    const responseUpdated = await application.settings.getSetting(validSetting)
    expect(responseUpdated).to.eql(updatedFakePayload)
  })

  it('reads a nonexistent setting', async () => {
    const setting = await application.settings.getSetting(validSetting)
    expect(setting).to.equal(undefined)
  })

  it('reads a nonexistent sensitive setting', async () => {
    const setting = await application.settings.getDoesSensitiveSettingExist(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
    )
    expect(setting).to.equal(false)
  })

  it('creates and reads a sensitive setting', async () => {
    await application.settings.updateSetting(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
      'fake_secret',
      true,
    )
    const setting = await application.settings.getDoesSensitiveSettingExist(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
    )
    expect(setting).to.equal(true)
  })

  it('creates and lists a sensitive setting', async () => {
    await application.settings.updateSetting(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
      'fake_secret',
      true,
    )
    await application.settings.updateSetting(
      SettingName.create(SettingName.NAMES.LogSessionUserAgent).getValue(),
      LogSessionUserAgentOption.Enabled,
    )
    const settings = await application.settings.listSettings()
    expect(settings.getSettingValue(SettingName.create(SettingName.NAMES.LogSessionUserAgent).getValue())).to.eql(
      LogSessionUserAgentOption.Enabled,
    )
    expect(settings.getSettingValue(SettingName.create(SettingName.NAMES.MfaSecret).getValue())).to.not.be.ok
  })

  it('reads a subscription setting', async () => {
    await context.activatePaidSubscriptionForUser()

    const setting = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
    )
    expect(setting).to.be.a('string')
  })

  it('persist irreplaceable subscription settings between subsequent subscriptions', async () => {
    await reInitializeApplicationWithRealCrypto()

    await context.activatePaidSubscriptionForUser()

    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    await Files.uploadFile(application.files, buffer, 'my-file', 'md', 1000)

    await Factory.sleep(1)

    const limitSettingBefore = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
    )

    const usedSettingBefore = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
    )
    expect(usedSettingBefore).to.equal('1374')

    await context.activatePaidSubscriptionForUser({
      cancelPreviousSubscription: true,
    })

    await context.activatePaidSubscriptionForUser({
      cancelPreviousSubscription: true,
    })

    const limitSettingAfter = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
    )
    expect(limitSettingAfter).to.equal(limitSettingBefore)

    const usedSettingAfter = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
    )
    expect(usedSettingAfter).to.equal(usedSettingBefore)

    const afterResponse = await fetch('/mocha/assets/small_file.md')
    const afterBuffer = new Uint8Array(await afterResponse.arrayBuffer())

    await Files.uploadFile(application.files, afterBuffer, 'my-file', 'md', 1000)

    await Factory.sleep(1)

    const limitSettingAfterSecondUpload = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
    )
    expect(limitSettingAfterSecondUpload).to.equal(limitSettingBefore)

    const usedSettingAfterSecondUpload = await application.settings.getSubscriptionSetting(
      SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
    )
    expect(usedSettingAfterSecondUpload).to.equal('2748')
  })
})
