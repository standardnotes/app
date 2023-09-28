import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault quota', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  let context

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
    sinon.restore()
    context = undefined
  })

  describe('using own quota', function () {
    it('should utilize my own quota when I am uploading to my shared vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const sharedVault = await Collaboration.createSharedVault(context)
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

      await context.syncAndAwaitNotificationsProcessing()

      const updatedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(updatedVault.sharing.fileBytesUsed).to.equal(1374)

      const bytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+bytesUsedSetting).to.equal(1374)
    })

    it('should not allow me to upload a file that exceeds my quota', async () => {
      await context.activatePaidSubscriptionForUser()

      const bytesLimitSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
      )
      expect(+bytesLimitSetting).to.equal(107_374_182_400)

      const sharedVault = await Collaboration.createSharedVault(context)
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const result = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault, { byteLengthOverwrite: 107_374_182_401 })

      expect(isClientDisplayableError(result)).to.be.true

      const bytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+bytesUsedSetting).to.equal(0)
    })

    it('should utilize my own quota when I am moving a user file to my vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)

      const sharedVault = await Collaboration.createSharedVault(context)
      await context.vaults.moveItemToVault(sharedVault, uploadedFile)

      await context.syncAndAwaitNotificationsProcessing()

      const updatedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(updatedVault.sharing.fileBytesUsed).to.equal(1374)

      const bytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+bytesUsedSetting).to.equal(1374)
    })
  })

  describe('using contact quota', function () {
    it('should utilize my quota when contact is uploading to my shared vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      await contactContext.activatePaidSubscriptionForUser()

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      await Files.uploadFile(contactContext.files, buffer, 'my-file', 'md', 1000, sharedVault)

      await context.syncAndAwaitNotificationsProcessing()
      await contactContext.syncAndAwaitNotificationsProcessing()

      const updatedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(updatedVault.sharing.fileBytesUsed).to.equal(1374)

      const myBytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+myBytesUsedSetting).to.equal(1374)

      const contactBytesUsedSetting = await contactContext.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+contactBytesUsedSetting).to.equal(0)

      await deinitContactContext()
    })

    it('should not allow my contact to upload a file that exceeds my quota', async () => {
      await context.activatePaidSubscriptionForUser({ subscriptionPlanName: 'PLUS_PLAN' })

      const myBytesLimitSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
      )
      expect(+myBytesLimitSetting).to.equal(104_857_600)

      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      await contactContext.activatePaidSubscriptionForUser({ subscriptionPlanName: 'PRO_PLAN' })

      const contactBytesLimitSetting = await contactContext.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
      )
      expect(+contactBytesLimitSetting).to.equal(107_374_182_400)

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const result = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault, { byteLengthOverwrite: 104_857_601 })

      expect(isClientDisplayableError(result)).to.be.true

      const bytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+bytesUsedSetting).to.equal(0)

      await deinitContactContext()
    })

    it('should utilize my quota when my contact is moving a shared file from contact vault to my vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      await contactContext.activatePaidSubscriptionForUser()

      const secondVault = await Collaboration.createSharedVault(contactContext)

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(contactContext.files, buffer, 'my-file', 'md', 1000, secondVault)

      await context.syncAndAwaitNotificationsProcessing()
      await contactContext.syncAndAwaitNotificationsProcessing()

      let updatedSharedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(updatedSharedVault.sharing.fileBytesUsed).to.equal(0)

      let updatedSecondVault = contactContext.vaults.getVault({ keySystemIdentifier: secondVault.systemIdentifier }).getValue()
      expect(updatedSecondVault.sharing.fileBytesUsed).to.equal(1374)

      let myBytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+myBytesUsedSetting).to.equal(0)

      let contactBytesUsedSetting = await contactContext.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+contactBytesUsedSetting).to.equal(1374)

      await contactContext.vaults.moveItemToVault(sharedVault, uploadedFile)

      await context.syncAndAwaitNotificationsProcessing()
      await contactContext.syncAndAwaitNotificationsProcessing()

      updatedSharedVault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(updatedSharedVault.sharing.fileBytesUsed).to.equal(1374)

      updatedSecondVault = contactContext.vaults.getVault({ keySystemIdentifier: secondVault.systemIdentifier }).getValue()
      expect(updatedSecondVault.sharing.fileBytesUsed).to.equal(0)

      myBytesUsedSetting = await context.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+myBytesUsedSetting).to.equal(1374)

      contactBytesUsedSetting = await contactContext.application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      expect(+contactBytesUsedSetting).to.equal(0)

      await deinitContactContext()
    })
  })
})
