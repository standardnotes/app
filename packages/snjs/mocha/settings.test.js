import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('settings service', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  const validSetting = SettingName.GoogleDriveBackupFrequency
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

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

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
    const setting = await application.settings.getDoesSensitiveSettingExist(SettingName.MfaSecret)
    expect(setting).to.equal(false)
  })

  it('creates and reads a sensitive setting', async () => {
    await application.settings.updateSetting(SettingName.MfaSecret, 'fake_secret', true)
    const setting = await application.settings.getDoesSensitiveSettingExist(SettingName.MfaSecret)
    expect(setting).to.equal(true)
  })

  it('creates and lists a sensitive setting', async () => {
    await application.settings.updateSetting(SettingName.MfaSecret, 'fake_secret', true)
    await application.settings.updateSetting(SettingName.MuteFailedBackupsEmails, MuteFailedBackupsEmailsOption.Muted)
    const settings = await application.settings.listSettings()
    expect(settings.getSettingValue(SettingName.MuteFailedBackupsEmails)).to.eql(MuteFailedBackupsEmailsOption.Muted)
    expect(settings.getSettingValue(SettingName.MfaSecret)).to.not.be.ok
  })

  it('reads a subscription setting', async () => {
    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: 1,
      subscriptionName: 'PRO_PLAN',
      subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
      timestamp: Date.now(),
      offline: false,
      discountCode: null,
      limitedDiscountPurchased: false,
      newSubscriber: true,
      totalActiveSubscriptionsCount: 1,
      userRegisteredAt: 1,
      billingFrequency: 12,
      payAmount: 59.00
    })

    await Factory.sleep(2)

    const setting = await application.settings.getSubscriptionSetting('FILE_UPLOAD_BYTES_LIMIT')
    expect(setting).to.be.a('string')
  })

  it('persist irreplaceable subscription settings between subsequent subscriptions', async () => {
    await reInitializeApplicationWithRealCrypto()

    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: 42,
      subscriptionName: 'PRO_PLAN',
      subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
      timestamp: Date.now(),
      offline: false,
      discountCode: null,
      limitedDiscountPurchased: false,
      newSubscriber: true,
      totalActiveSubscriptionsCount: 1,
      userRegisteredAt: 1,
      billingFrequency: 12,
      payAmount: 59.00
    })
    await Factory.sleep(2)

    const response = await fetch('/packages/snjs/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    await Files.uploadFile(application.fileService, buffer, 'my-file', 'md', 1000)

    await Factory.sleep(1)

    const limitSettingBefore = await application.settings.getSubscriptionSetting('FILE_UPLOAD_BYTES_LIMIT')
    expect(limitSettingBefore).to.equal('107374182400')

    const usedSettingBefore = await application.settings.getSubscriptionSetting('FILE_UPLOAD_BYTES_USED')
    expect(usedSettingBefore).to.equal('196')

    await Factory.publishMockedEvent('SUBSCRIPTION_EXPIRED', {
      userEmail: context.email,
      subscriptionId: 42,
      subscriptionName: 'PRO_PLAN',
      timestamp: Date.now(),
      offline: false,
      totalActiveSubscriptionsCount: 1,
      userExistingSubscriptionsCount: 1,
      billingFrequency: 12,
      payAmount: 59.00
    })
    await Factory.sleep(2)

    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: 43,
      subscriptionName: 'PRO_PLAN',
      subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
      timestamp: Date.now(),
      offline: false,
      discountCode: null,
      limitedDiscountPurchased: false,
      newSubscriber: false,
      totalActiveSubscriptionsCount: 2,
      userRegisteredAt: 1,
      billingFrequency: 12,
      payAmount: 59.00
    })
    await Factory.sleep(2)

    const limitSettingAfter = await application.settings.getSubscriptionSetting('FILE_UPLOAD_BYTES_LIMIT')
    expect(limitSettingAfter).to.equal(limitSettingBefore)

    const usedSettingAfter = await application.settings.getSubscriptionSetting('FILE_UPLOAD_BYTES_USED')
    expect(usedSettingAfter).to.equal(usedSettingBefore)
  })
})
