import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('designated survival', function () {
  this.timeout(Factory.ThirtySecondTimeout)

  let context
  let secondContext
  let thirdContext

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createVaultsContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  afterEach(async function () {
    if (context && !context.application.dealloced) {
      await context.deinit()
    }
    localStorage.clear()
    sinon.restore()
    context = undefined
    if (secondContext) {
      await secondContext.deinit()
      secondContext = undefined
    }
    if (thirdContext) {
      await thirdContext.deinit()
      thirdContext = undefined
    }
  })

  it('should indicate that a vault has a designated survivor', async () => {
    const { sharedVault, contactContext } =
    await Collaboration.createSharedVaultWithAcceptedInvite(context)
    secondContext = contactContext

    let vault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(vault.sharing.designatedSurvivor).to.be.null

    await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

    await context.syncAndAwaitNotificationsProcessing()

    vault = context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(vault.sharing.designatedSurvivor).to.equal(contactContext.userUuid)
  })

  describe('owner of a shared vault with a designated survivor removing the vault', () => {
    it.skip('should remove all users from the vault upon shared vault removal', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      await context.sharedVaults.deleteSharedVault(sharedVault)

      await Factory.sleep(2)

      await context.syncAndAwaitNotificationsProcessing()
      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      expect(context.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
      expect(context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
      expect(context.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

      expect(secondContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
      expect(secondContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
      expect(secondContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

      expect(thirdContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
      expect(thirdContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
      expect(thirdContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty
    })

    it('should not transition items of the owner in the vault to the designated survivor', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, sharedVault, note)

      await context.sharedVaults.deleteSharedVault(sharedVault)

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      const contactNote = secondContext.items.findItem(note.uuid)
      expect(contactNote).to.be.undefined

      const thirdPartyNote = thirdContext.items.findItem(note.uuid)
      expect(thirdPartyNote).to.be.undefined
    })

    it('should not allow to download files of the owner in the vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

      await secondContext.syncAndAwaitNotificationsProcessing()

      const sharedFileBefore = secondContext.items.findItem(uploadedFile.uuid)
      expect(sharedFileBefore).to.not.be.undefined
      expect(sharedFileBefore.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      await context.sharedVaults.deleteSharedVault(sharedVault)

      await secondContext.syncAndAwaitNotificationsProcessing()

      const sharedFileAfter = secondContext.items.findItem(uploadedFile.uuid)
      expect(sharedFileAfter).to.be.undefined
    })

    it('should not transition vault ownership to the designated survivor', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      await context.sharedVaults.deleteSharedVault(sharedVault)

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      const contactVaultOrError = secondContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
      expect(contactVaultOrError.isFailed()).to.be.true

      const thirdPartyVaultOrError = thirdContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
      expect(thirdPartyVaultOrError.isFailed()).to.be.true
    })
  })

  describe('owner of a shared vault with a designated survivor deleting their account', () => {
    it('should not remove all users from the vault upon account removal', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      Factory.handlePasswordChallenges(context.application, context.password)
      await context.application.user.deleteAccount()

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      const sharedVaultUsers = await secondContext.vaultUsers.getSharedVaultUsersFromServer(sharedVault)
      expect(sharedVaultUsers.length).to.equal(2)

      expect(secondContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()).to.not.be.undefined
      expect(secondContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.not.be.undefined
      expect(secondContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.not.be.empty

      expect(thirdContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()).to.not.be.undefined
      expect(thirdContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.not.be.undefined
      expect(thirdContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.not.be.empty
    })

    it('should transition items of the owner in the vault to the designated survivor', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      const note = await context.createSyncedNote('foo', 'bar')
      await Collaboration.moveItemToVault(context, sharedVault, note)

      Factory.handlePasswordChallenges(context.application, context.password)
      await context.application.user.deleteAccount()

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      const sharedVaultUsers = await secondContext.vaultUsers.getSharedVaultUsersFromServer(sharedVault)
      expect(sharedVaultUsers.length).to.equal(2)

      const contactNote = secondContext.items.findItem(note.uuid)
      expect(contactNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)
      expect(contactNote.user_uuid).to.equal(secondContext.userUuid)

      const thirdPartyNote = thirdContext.items.findItem(note.uuid)
      expect(thirdPartyNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)
      expect(thirdPartyNote.user_uuid).to.equal(secondContext.userUuid)
    })

    it('should still allow to download files of the owner in the vault', async () => {
      await context.activatePaidSubscriptionForUser()

      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, sharedVault)

      await secondContext.syncAndAwaitNotificationsProcessing()
      await context.syncAndAwaitNotificationsProcessing()

      const sharedFileBefore = secondContext.items.findItem(uploadedFile.uuid)
      expect(sharedFileBefore).to.not.be.undefined
      expect(sharedFileBefore.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      Factory.handlePasswordChallenges(context.application, context.password)
      await context.application.user.deleteAccount()

      await secondContext.syncAndAwaitNotificationsProcessing()

      const sharedFileAfter = secondContext.items.findItem(uploadedFile.uuid)
      expect(sharedFileAfter).to.not.be.undefined
      expect(sharedFileAfter.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(secondContext.files, sharedFileAfter)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should transition vault ownership to the designated survivor', async () => {
      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      await Collaboration.designateSharedVaultSurvior(context, sharedVault, contactContext.userUuid)

      const { thirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
        context,
        sharedVault,
      )
      thirdContext = thirdPartyContext

      await Collaboration.acceptAllInvites(thirdContext)

      Factory.handlePasswordChallenges(context.application, context.password)
      await context.application.user.deleteAccount()

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      const contactVault = secondContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(contactVault.sharing.ownerUserUuid).to.equal(secondContext.userUuid)

      const thirdPartyVault = thirdContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
      expect(thirdPartyVault.sharing.ownerUserUuid).to.equal(secondContext.userUuid)
    })
  })

  describe('owner of a shared vault without a designated survivor deleting their account', () => {
    it('should remove all users from all shared vaults upon account removal', async () => {
      await context.activatePaidSubscriptionForUser()

      const { sharedVault, contactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
      secondContext = contactContext

      const result = await Collaboration.createSharedVaultWithAcceptedInvite(context)
      thirdContext = result.contactContext
      const secondSharedVault = result.sharedVault

      Factory.handlePasswordChallenges(context.application, context.password)
      await context.application.user.deleteAccount()

      await Factory.sleep(2)

      await secondContext.syncAndAwaitNotificationsProcessing()
      await thirdContext.syncAndAwaitNotificationsProcessing()

      expect(secondContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).isFailed()).to.be.true
      expect(secondContext.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)).to.be.undefined
      expect(secondContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)).to.be.empty

      expect(thirdContext.vaults.getVault({ keySystemIdentifier: secondSharedVault.systemIdentifier }).isFailed()).to.be.true
      expect(thirdContext.keys.getPrimaryKeySystemRootKey(secondSharedVault.systemIdentifier)).to.be.undefined
      expect(thirdContext.keys.getKeySystemItemsKeys(secondSharedVault.systemIdentifier)).to.be.empty
    })
  })
})
