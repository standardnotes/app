import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault items', function () {
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

  it('should add item to shared vault with no other members', async () => {
    const note = await context.createSyncedNote('foo', 'bar')

    const sharedVault = await Collaboration.createSharedVault(context)

    await Collaboration.moveItemToVault(context, sharedVault, note)

    const updatedNote = context.items.findItem(note.uuid)
    expect(updatedNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)
    expect(updatedNote.shared_vault_uuid).to.equal(sharedVault.sharing.sharedVaultUuid)
  })

  it('should add item to shared vault with contact', async () => {
    const note = await context.createSyncedNote('foo', 'bar')

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await Collaboration.moveItemToVault(context, sharedVault, note)

    await contactContext.sync()

    const updatedNote = context.items.findItem(note.uuid)
    expect(updatedNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)

    const contactNote = contactContext.items.findItem(note.uuid)
    expect(contactNote.key_system_identifier).to.equal(sharedVault.systemIdentifier)

    await deinitContactContext()
  })

  it('received items from previously trusted contact should be decrypted', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const sharedVault = await Collaboration.createSharedVault(context)

    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)
    const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

    contactContext.lockSyncing()
    await context.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      currentContextContact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )
    await Collaboration.moveItemToVault(context, sharedVault, note)

    const promise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()
    contactContext.unlockSyncing()
    await contactContext.sync()
    await Collaboration.acceptAllInvites(contactContext)
    await promise

    const receivedItemsKey = contactContext.keys.getPrimaryKeySystemItemsKey(sharedVault.systemIdentifier)
    expect(receivedItemsKey).to.not.be.undefined
    expect(receivedItemsKey.itemsKey).to.not.be.undefined

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote.title).to.equal('foo')
    expect(receivedNote.text).to.equal(note.text)

    await deinitContactContext()
  })

  it('shared vault creator should receive changes from other members', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(context, sharedVault, note)
    await contactContext.sync()

    await contactContext.mutator.changeItem({ uuid: note.uuid }, (mutator) => {
      mutator.title = 'new title'
    })
    await contactContext.sync()
    await context.sync()

    const receivedNote = context.items.findItem(note.uuid)
    expect(receivedNote.title).to.equal('new title')

    await deinitContactContext()
  })

  it('items added by collaborator should be received by shared vault owner', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const newNote = await contactContext.createSyncedNote('new note', 'new note text')
    await Collaboration.moveItemToVault(contactContext, sharedVault, newNote)

    await context.sync()

    const receivedNote = context.items.findItem(newNote.uuid)
    expect(receivedNote).to.not.be.undefined
    expect(receivedNote.title).to.equal('new note')

    await deinitContactContext()
  })

  it('adding item to vault while belonging to other vault should move the item to new vault', async () => {
    await context.activatePaidSubscriptionForUser()

    const { note, contactContext, contact, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const { sharedVault: otherSharedVault } = await Collaboration.createSharedVaultAndInviteContact(
      context,
      contactContext,
      contact,
    )

    await Collaboration.acceptAllInvites(contactContext)

    const updatedNote = await Collaboration.moveItemToVault(context, otherSharedVault, note)

    expect(updatedNote.key_system_identifier).to.equal(otherSharedVault.systemIdentifier)
    expect(updatedNote.shared_vault_uuid).to.equal(otherSharedVault.sharing.sharedVaultUuid)

    await contactContext.sync()

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote.title).to.equal(note.title)
    expect(receivedNote.key_system_identifier).to.equal(otherSharedVault.systemIdentifier)
    expect(receivedNote.shared_vault_uuid).to.equal(otherSharedVault.sharing.sharedVaultUuid)

    await deinitContactContext()
  })
})
