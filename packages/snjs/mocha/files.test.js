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

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()

    application = undefined
    context = undefined
  })

  const setup = async ({ fakeCrypto, subscription = true }) => {
    if (fakeCrypto) {
      context = await Factory.createAppContextWithFakeCrypto()
    } else {
      context = await Factory.createAppContextWithRealCrypto()
    }

    await context.launch()

    application = context.application
    fileService = context.application.files
    itemManager = context.application.items

    await Factory.registerUserToApplication({
      application: context.application,
      email: context.email,
      password: context.password,
    })

    if (subscription) {
      await context.activatePaidSubscriptionForUser()
    }
  }

  it('should create valet token from server', async function () {
    await setup({ fakeCrypto: true, subscription: true })

    const remoteIdentifier = Utils.generateUuid()
    const token = await application.legacyApi.createUserFileValetToken(remoteIdentifier, ValetTokenOperation.Write)

    expect(token.length).to.be.above(0)
  })

  it('should not create valet token from server when user has no subscription', async function () {
    await setup({ fakeCrypto: true, subscription: false })

    const remoteIdentifier = Utils.generateUuid()
    const tokenOrError = await application.legacyApi.createUserFileValetToken(
      remoteIdentifier,
      ValetTokenOperation.Write,
    )

    expect(isClientDisplayableError(tokenOrError)).to.equal(true)
  })

  it('should not create valet token from server when user has an expired subscription', async function () {
    await setup({ fakeCrypto: true, subscription: false })

    const dateAnHourBefore = new Date()
    dateAnHourBefore.setHours(dateAnHourBefore.getHours() - 1)

    await context.activatePaidSubscriptionForUser({
      expiresAt: dateAnHourBefore,
    })

    const remoteIdentifier = Utils.generateUuid()
    const tokenOrError = await application.legacyApi.createUserFileValetToken(
      remoteIdentifier,
      ValetTokenOperation.Write,
    )

    expect(isClientDisplayableError(tokenOrError)).to.equal(true)
  })

  it('creating two upload sessions successively should succeed', async function () {
    await setup({ fakeCrypto: true, subscription: true })

    const firstToken = await application.legacyApi.createUserFileValetToken(
      Utils.generateUuid(),
      ValetTokenOperation.Write,
    )
    const firstSession = await application.legacyApi.startUploadSession(firstToken, 'user')

    expect(firstSession.uploadId).to.be.ok

    const secondToken = await application.legacyApi.createUserFileValetToken(
      Utils.generateUuid(),
      ValetTokenOperation.Write,
    )
    const secondSession = await application.legacyApi.startUploadSession(secondToken, 'user')

    expect(secondSession.uploadId).to.be.ok
  })

  it('should encrypt and upload small file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const downloadedBytes = await Files.downloadFile(fileService, file)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should encrypt and upload big file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/mocha/assets/two_mb_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 100000)

    const downloadedBytes = await Files.downloadFile(fileService, file)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should delete file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await Files.uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const error = await fileService.deleteFile(file)

    expect(error).to.not.be.ok

    expect(itemManager.findItem(file.uuid)).to.not.be.ok

    const downloadError = await fileService.downloadFile(file)

    expect(downloadError).to.be.ok
  })
})
