import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault permissions', function () {
  this.timeout(Factory.TwentySecondTimeout)

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

  it('non-admin user should not be able to invite user', async () => {
    context.anticipateConsoleError('Could not create invite')

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const thirdParty = await Collaboration.createContactContext()
    const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
      contactContext,
      thirdParty.contactContext,
    )
    const result = await contactContext.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      thirdPartyContact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

    expect(result.isFailed()).to.be.true

    await thirdParty.deinitContactContext()

    await deinitContactContext()
  })

  it('should not be able to leave shared vault as creator', async () => {
    context.anticipateConsoleError('Could not delete user')

    const sharedVault = await Collaboration.createSharedVault(context)

    const result = await context.vaultUsers.removeUserFromSharedVault(sharedVault, context.userUuid)
    expect(result.isFailed()).to.be.true
  })

  it('should be able to leave shared vault as added admin', async () => {
    const { contactVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultUserPermission.PERMISSIONS.Admin)

    const result = await contactContext.vaultUsers.leaveSharedVault(contactVault)

    expect(isClientDisplayableError(result)).to.be.false

    await deinitContactContext()
  })

  it('non-admin user should not be able to create or update vault items keys with the server', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const keySystemItemsKey = contactContext.keys.getKeySystemItemsKeys(sharedVault.systemIdentifier)[0]

    await contactContext.mutator.changeItem(keySystemItemsKey, () => {})
    const promise = contactContext.resolveWithConflicts()
    await contactContext.sync()

    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.KeySystemItemsKey)

    await deinitContactContext()
  })

  it('read user should not be able to make changes to items', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context, SharedVaultUserPermission.PERMISSIONS.Read)
    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(context, sharedVault, note)
    await contactContext.sync()

    await contactContext.mutator.changeItem({ uuid: note.uuid }, (mutator) => {
      mutator.title = 'new title'
    })

    const promise = contactContext.resolveWithConflicts()
    await contactContext.sync()
    const conflicts = await promise

    expect(conflicts.length).to.equal(1)
    expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.TYPES.Note)

    await deinitContactContext()
  })

  it('should be able to move item from vault to user as a write user if the item belongs to me', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const note = await contactContext.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(contactContext, sharedVault, note)
    await contactContext.sync()

    const promise = contactContext.resolveWithConflicts()
    await contactContext.vaults.removeItemFromVault(note)
    const conflicts = await promise

    expect(conflicts.length).to.equal(0)

    const duplicateNote = contactContext.findDuplicateNote(note.uuid)
    expect(duplicateNote).to.be.undefined

    const existingNote = contactContext.items.findItem(note.uuid)
    expect(existingNote.key_system_identifier).to.not.be.ok

    await deinitContactContext()
  })
})
