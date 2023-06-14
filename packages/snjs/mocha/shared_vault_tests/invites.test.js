import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault invites', function () {
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

  it('should invite contact to vault', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

    const vaultInvite = await sharedVaults.inviteContactToSharedVault(sharedVault, contact, SharedVaultPermission.Write)

    expect(vaultInvite).to.not.be.undefined
    expect(vaultInvite.shared_vault_uuid).to.equal(sharedVault.sharedVaultUuid)
    expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
    expect(vaultInvite.encrypted_message).to.not.be.undefined
    expect(vaultInvite.permissions).to.equal(SharedVaultPermission.Write)
    expect(vaultInvite.updated_at_timestamp).to.not.be.undefined
    expect(vaultInvite.created_at_timestamp).to.not.be.undefined

    await deinitContactContext()
  })

  it.only('invites from trusted contact should be pending as trusted', async () => {
    const { contactContext, deinitContactContext } = await createSharedVaultWithUnacceptedButTrustedInvite(context)

    const invites = contactContext.sharedVaults.getCachedPendingInviteRecords()

    expect(invites[0].trusted).to.be.true

    await deinitContactContext()
  })

  it.only('invites from untrusted contact should be pending as untrusted', async () => {
    const { contactContext, deinitContactContext } = await createSharedVaultWithUnacceptedAndUntrustedInvite(context)

    const invites = contactContext.sharedVaults.getCachedPendingInviteRecords()

    expect(invites[0].trusted).to.be.false

    await deinitContactContext()
  })

  it.only('invite should include delegated trusted contacts', async () => {
    const { deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteThirdPartyToSharedVault(
      context,
      sharedVault,
    )

    const invites = thirdPartyContext.sharedVaults.getCachedPendingInviteRecords()

    const message = invites[0].message
    const delegatedContacts = message.data.trustedContacts
    expect(delegatedContacts.length).to.equal(2)

    await deinitThirdPartyContext()
    await deinitContactContext()
  })

  it('should sync a shared vault from scratch after accepting an invitation', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.addItemToVault(context, sharedVault, note)

    /** Create a mutually trusted contact */
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
    await contactContext.sync()

    await sharedVaults.inviteContactToSharedVault(sharedVault, contact, SharedVaultPermission.Write)

    /** Contact should now sync and expect to find note */
    const promise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()
    await contactContext.sync()
    await Collaboration.acceptAllInvites(contactContext)
    await promise

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote).to.not.be.undefined
    expect(receivedNote.title).to.equal('foo')
    expect(receivedNote.text).to.equal(note.text)

    await deinitContactContext()
  })

  it('received invites from untrusted contact should not be trusted', async () => {
    await context.createSyncedNote('foo', 'bar')
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const sharedVault = await Collaboration.createSharedVault(context)

    const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await sharedVaults.inviteContactToSharedVault(sharedVault, currentContextContact, SharedVaultPermission.Write)

    await contactContext.sharedVaults.downloadInboundInvites()
    expect(contactContext.sharedVaults.getCachedPendingInviteRecords()[0].trusted).to.be.false

    await deinitContactContext()
  })

  it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
    await context.createSyncedNote('foo', 'bar')
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const sharedVault = await Collaboration.createSharedVault(context)

    const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await sharedVaults.inviteContactToSharedVault(sharedVault, currentContextContact, SharedVaultPermission.Write)

    await contactContext.sharedVaults.downloadInboundInvites()
    expect(contactContext.sharedVaults.getCachedPendingInviteRecords()[0].trusted).to.be.false

    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    expect(contactContext.sharedVaults.getCachedPendingInviteRecords()[0].trusted).to.be.true

    await deinitContactContext()
  })

  it('received items should contain the uuid of the contact who sent the item', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote).to.not.be.undefined
    expect(receivedNote.user_uuid).to.equal(context.userUuid)

    await deinitContactContext()
  })

  it('items should contain the uuid of the last person who edited it', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote.last_edited_by_uuid).to.not.be.undefined
    expect(receivedNote.last_edited_by_uuid).to.equal(context.userUuid)

    await contactContext.changeNoteTitleAndSync(receivedNote, 'new title')
    await context.sync()

    const updatedNote = context.items.findItem(note.uuid)
    expect(updatedNote.last_edited_by_uuid).to.not.be.undefined
    expect(updatedNote.last_edited_by_uuid).to.equal(contactContext.userUuid)

    await deinitContactContext()
  })

  it('canceling an invite should remove it from recipient pending invites', async () => {
    const { invite, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)

    const preInvites = await contactContext.sharedVaults.downloadInboundInvites()
    expect(preInvites.length).to.equal(1)

    await sharedVaults.deleteInvite(invite)

    const postInvites = await contactContext.sharedVaults.downloadInboundInvites()
    expect(postInvites.length).to.equal(0)

    await deinitContactContext()
  })
})
