import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault files', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let vaults

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    vaults = context.vaults
    await context.publicMockSubscriptionPurchaseEvent()
  })

  it('should be able to upload and download file to vault as owner', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())
    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

    const file = context.items.findItem(uploadedFile.uuid)
    expect(file).to.not.be.undefined
    expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)
    expect(file.key_system_identifier).to.equal(sharedVault.systemIdentifier)

    const downloadedBytes = await Files.downloadFile(context.files, file)
    expect(downloadedBytes).to.eql(buffer)
  })

  it('should be able to move a user file to a vault', async () => {
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)

    const sharedVault = await Collaboration.createSharedVault(context)
    const addedFile = await vaults.addItemToVault(sharedVault, uploadedFile)

    const downloadedBytes = await Files.downloadFile(context.files, addedFile)
    expect(downloadedBytes).to.eql(buffer)
  })

  it('should be able to move a file out of its vault', async () => {
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const sharedVault = await Collaboration.createSharedVault(context)
    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

    const removedFile = await vaults.removeItemFromVault(uploadedFile)
    expect(removedFile.key_system_identifier).to.not.be.ok

    const downloadedBytes = await Files.downloadFile(context.files, removedFile)
    expect(downloadedBytes).to.eql(buffer)
  })

  it('should be able to download vault file as collaborator', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())
    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

    await contactContext.sync()

    const sharedFile = contactContext.items.findItem(uploadedFile.uuid)
    expect(sharedFile).to.not.be.undefined
    expect(sharedFile.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

    const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
    expect(downloadedBytes).to.eql(buffer)

    await deinitContactContext()
  })

  it('should be able to upload vault file as collaborator', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const uploadedFile = await Files.uploadFile(contactContext.files, buffer, 'my-file', 'md', 1000, sharedVault)

    await context.sync()

    const file = context.items.findItem(uploadedFile.uuid)
    expect(file).to.not.be.undefined
    expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)

    const downloadedBytes = await Files.downloadFile(context.files, file)
    expect(downloadedBytes).to.eql(buffer)

    await deinitContactContext()
  })

  it('should be able to delete vault file as write user', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultPermission.Write)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

    await contactContext.sync()

    const file = contactContext.items.findItem(uploadedFile.uuid)
    const result = await contactContext.files.deleteFile(file)
    expect(result).to.be.undefined

    const foundFile = contactContext.items.findItem(file.uuid)
    expect(foundFile).to.be.undefined

    await deinitContactContext()
  })

  it('should not be able to delete vault file as read user', async () => {
    context.anticipateConsoleError('Could not create valet token')

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultPermission.Read)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())

    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

    await contactContext.sync()

    const file = contactContext.items.findItem(uploadedFile.uuid)
    const result = await contactContext.files.deleteFile(file)
    expect(isClientDisplayableError(result)).to.be.true

    const foundFile = contactContext.items.findItem(file.uuid)
    expect(foundFile).to.not.be.undefined

    await deinitContactContext()
  })

  it('should be able to download recently moved vault file as collaborator', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())
    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)
    const addedFile = await vaults.addItemToVault(sharedVault, uploadedFile)

    await contactContext.sync()

    const sharedFile = contactContext.items.findItem(addedFile.uuid)
    expect(sharedFile).to.not.be.undefined
    expect(sharedFile.remoteIdentifier).to.equal(addedFile.remoteIdentifier)

    const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
    expect(downloadedBytes).to.eql(buffer)

    await deinitContactContext()
  })

  it('should not be able to download file after being removed from vault', async () => {
    context.anticipateConsoleError('Could not create valet token')

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    const response = await fetch('/mocha/assets/small_file.md')
    const buffer = new Uint8Array(await response.arrayBuffer())
    const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)
    await contactContext.sync()

    await context.sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    const file = contactContext.items.findItem(uploadedFile.uuid)
    await Factory.expectThrowsAsync(() => Files.downloadFile(contactContext.files, file), 'Could not download file')

    await deinitContactContext()
  })
})
