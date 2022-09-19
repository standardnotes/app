import * as Factory from './lib/factory.js'
import * as Utils from './lib/Utils.js'
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
        subscriptionId: 1,
        subscriptionName: 'PLUS_PLAN',
        subscriptionExpiresAt: (new Date().getTime() + 3_600_000) * 1_000,
        timestamp: Date.now(),
        offline: false,
      })
      await Factory.sleep(0.25)
    }
  }

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  const uploadFile = async (fileService, buffer, name, ext, chunkSize) => {
    const operation = await fileService.beginNewFileUpload(buffer.byteLength)

    let chunkId = 1
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const readUntil = i + chunkSize > buffer.length ? buffer.length : i + chunkSize
      const chunk = buffer.slice(i, readUntil)
      const isFinalChunk = readUntil === buffer.length

      const error = await fileService.pushBytesForUpload(operation, chunk, chunkId++, isFinalChunk)
      if (error) {
        throw new Error('Could not upload file chunk')
      }
    }

    const file = await fileService.finishUpload(operation, name, ext)

    return file
  }

  const downloadFile = async (fileService, itemManager, remoteIdentifier) => {
    const file = itemManager.getItems(ContentType.File).find((file) => file.remoteIdentifier === remoteIdentifier)

    let receivedBytes = new Uint8Array()

    await fileService.downloadFile(file, (decryptedBytes) => {
      receivedBytes = new Uint8Array([...receivedBytes, ...decryptedBytes])
    })

    return receivedBytes
  }

  it('should create valet token from server', async function () {
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

  it('should not create valet token from server when user has an expired subscription', async function () {
    await setup({ fakeCrypto: true, subscription: false })

    await Factory.publishMockedEvent('SUBSCRIPTION_PURCHASED', {
      userEmail: context.email,
      subscriptionId: 1,
      subscriptionName: 'PLUS_PLAN',
      subscriptionExpiresAt: (new Date().getTime() - 3_600_000) * 1_000,
      timestamp: Date.now(),
      offline: false,
    })

    await Factory.sleep(0.25)

    const remoteIdentifier = Utils.generateUuid()
    const tokenOrError = await application.apiService.createFileValetToken(remoteIdentifier, 'write')

    expect(tokenOrError.tag).to.equal('expired-subscription')
  })

  it('creating two upload sessions successively should succeed', async function () {
    await setup({ fakeCrypto: true, subscription: true })

    const firstToken = await application.apiService.createFileValetToken(Utils.generateUuid(), 'write')
    const firstSession = await application.apiService.startUploadSession(firstToken)

    expect(firstSession.uploadId).to.be.ok

    const secondToken = await application.apiService.createFileValetToken(Utils.generateUuid(), 'write')
    const secondSession = await application.apiService.startUploadSession(secondToken)

    expect(secondSession.uploadId).to.be.ok
  })

  it('should encrypt and upload small file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const downloadedBytes = await downloadFile(fileService, itemManager, file.remoteIdentifier)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should encrypt and upload big file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/two_mb_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await uploadFile(fileService, buffer, 'my-file', 'md', 100000)

    const downloadedBytes = await downloadFile(fileService, itemManager, file.remoteIdentifier)

    expect(downloadedBytes).to.eql(buffer)
  })

  it('should delete file', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    const response = await fetch('/packages/snjs/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const file = await uploadFile(fileService, buffer, 'my-file', 'md', 1000)

    const error = await fileService.deleteFile(file)

    expect(error).to.not.be.ok

    expect(itemManager.findItem(file.uuid)).to.not.be.ok

    const downloadError = await fileService.downloadFile(file)

    expect(downloadError).to.be.ok
  })

  it.skip('should cancel file download', async function () {
    await setup({ fakeCrypto: false, subscription: true })

    // ...
  })
})
