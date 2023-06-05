import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.skip('shared vault deletion', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let sharedVaults

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    sharedVaults = context.sharedVaults
  })

  it('should remove item from all user devices when item is deleted permanently', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const promise = context.resolveWhenSavedSyncPayloadsIncludesItemUuid(note.uuid)
    await context.items.setItemToBeDeleted(note)
    await context.sync()
    await contactContext.sync()
    await promise

    const originatorNote = context.items.findItem(note.uuid)
    expect(originatorNote).to.be.undefined

    const collaboratorNote = contactContext.items.findItem(note.uuid)
    expect(collaboratorNote).to.be.undefined

    await deinitContactContext()
  })

  it('attempting to delete a note received by and already deleted by another person should not cause infinite conflicts', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const promise = context.resolveWhenSavedSyncPayloadsIncludesItemUuid(note.uuid)

    await context.items.setItemToBeDeleted(note)
    await contactContext.items.setItemToBeDeleted(note)

    await context.sync()
    await contactContext.sync()
    await promise

    const originatorNote = context.items.findItem(note.uuid)
    expect(originatorNote).to.be.undefined

    const collaboratorNote = contactContext.items.findItem(note.uuid)
    expect(collaboratorNote).to.be.undefined

    await deinitContactContext()
  })

  it('deleting a shared vault should remove all vault items from collaborator devices', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await sharedVaults.deleteSharedVault(sharedVault)
    await contactContext.sync()

    const originatorNote = context.items.findItem(note.uuid)
    expect(originatorNote).to.be.undefined

    const contactNote = contactContext.items.findItem(note.uuid)
    expect(contactNote).to.be.undefined

    await deinitContactContext()
  })

  it('being removed from shared vault should remove shared vault items locally', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const contactNote = contactContext.items.findItem(note.uuid)
    expect(contactNote).to.not.be.undefined

    await context.sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    await contactContext.sync()

    const updatedContactNote = contactContext.items.findItem(note.uuid)
    expect(updatedContactNote).to.be.undefined

    await deinitContactContext()
  })

  it('leaving a shared vault should remove its items locally', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context, SharedVaultPermission.Admin)

    const originalNote = contactContext.items.findItem(note.uuid)
    expect(originalNote).to.not.be.undefined

    await contactContext.sharedVaults.leaveSharedVault(sharedVault)

    const updatedContactNote = contactContext.items.findItem(note.uuid)
    expect(updatedContactNote).to.be.undefined

    await deinitContactContext()
  })

  it('removing an item from a vault should remove it from collaborator devices', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    await context.vaults.removeItemFromVault(note)

    await context.changeNoteTitleAndSync(note, 'new title')

    const receivedNote = contactContext.items.findItem(note.uuid)

    expect(receivedNote).to.not.be.undefined
    expect(receivedNote.title).to.not.equal('new title')
    expect(receivedNote.title).to.equal(note.title)

    await deinitContactContext()
  })

  it('should remove shared vault member', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const originalSharedVaultUsers = await sharedVaults.getSharedVaultUsers(sharedVault)
    expect(originalSharedVaultUsers.length).to.equal(2)

    const result = await sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    expect(isClientDisplayableError(result)).to.be.false

    const updatedSharedVaultUsers = await sharedVaults.getSharedVaultUsers(sharedVault)
    expect(updatedSharedVaultUsers.length).to.equal(1)

    await deinitContactContext()
  })
})
