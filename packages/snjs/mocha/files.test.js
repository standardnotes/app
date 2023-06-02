import * as Factory from './lib/factory.js'
import * as Utils from './lib/Utils.js'
import * as Files from './lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('files', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let fileService
  let itemManager
  let subscriptionId = 1001

  beforeEach(function () {
    localStorage.clear()
  })

  const setup = async ({ fakeCrypto, subscription = true }) => {
    if (fakeCrypto) {
      context = await Factory.createAppContextWithFakeCrypto()
    } else {
      context = await Factory.createAppContextWithRealCrypto()
    }

    await context.launch()

    application = context.application
    fileService = context.application.fileService
    itemManager = context.application.itemManager

    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })

    if (subscription) {
      await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
        userEmail: context.email,
        subscriptionId: subscriptionId++,
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
    }
  }

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  it('should create valet token from server - @paidfeature', async function () {
    await setup({ fakeCrypto: true, subscription: true })

    const remoteIdentifier = Utils.generateUuid()
    const token = await application.apiService.createFileValetToken(remoteIdentifier, 'write')

    expect(token.length).to.be.above(0)
  })

  it('should not create valet token from server when user has no subscription', async function () {
    await setup({ fakeCrypto: true, subscription: false })

    const remoteIdentifier = Utils.generateUuid()
    const tokenOrError = await application.apiService.createFileValetToken(remoteIdentifier, 'write')

    expect(tokenOrError.tag).to.equal('no-subscription')
  })

  it('should not create valet token from server when user has an expired subscription - @paidfeature', async function () {
    await setup({ fakeCrypto: true, subscription: false })

    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: subscriptionId++,
      subscriptionName: 'PLUS_PLAN',
      subscriptionExpiresAt: (new Date().getTime() - 3_600_000) * 1_000,
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

    const remoteIdentifier = Utils.generateUuid()
    const tokenOrError = await application.apiService.createFileValetToken(remoteIdentifier, 'write')

    expect(tokenOrError.tag).to.equal('expired-subscription')
  })

  it('creating two upload sessions successively should succeed - @paidfeature', async function () {
    await setup({ fakeCrypto: true, subscription: true })

    const firstToken = await application.apiService.createFileValetToken(Utils.generateUuid(), 'write')
    const firstSession = await application.apiService.startUploadSession(firstToken)

    expect(firstSession.uploadId).to.be.ok

    const secondToken = await application.apiService.createFileValetToken(Utils.generateUuid(), 'write')
    const secondSession = await application.apiService.startUploadSession(secondToken)

    expect(secondSession.uploadId).to.be.ok
  })

  it('should encrypt and upload small file - @paidfeature', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const downloadedBytes = await Files.downloadFile(fileService, itemManager, file.remoteIdentifier)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should encrypt and upload big file - @paidfeature', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/two_mb_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 100000)

    const downloadedBytes = await Files.downloadFile(fileService, itemManager, file.remoteIdentifier)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should delete file - @paidfeature', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const error = await fileService.deleteFile(file)

    expect(error).to.not.be.ok

    expect(itemManager.findItem(file.uuid)).to.not.be.ok

    const downloadError = await fileService.downloadFile(file)

    expect(downloadError).to.be.ok
  })
})
