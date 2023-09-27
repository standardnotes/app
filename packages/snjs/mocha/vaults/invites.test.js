import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault invites', function () {
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

  it('should invite contact to vault', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

    const vaultInvite = (
      await context.vaultInvites.inviteContactToSharedVault(
        sharedVault,
        contact,
        SharedVaultUserPermission.PERMISSIONS.Write,
      )
    ).getValue()

    expect(vaultInvite).to.not.be.undefined
    expect(vaultInvite.shared_vault_uuid).to.equal(sharedVault.sharing.sharedVaultUuid)
    expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
    expect(vaultInvite.encrypted_message).to.not.be.undefined
    expect(vaultInvite.permission).to.equal(SharedVaultUserPermission.PERMISSIONS.Write)
    expect(vaultInvite.updated_at_timestamp).to.not.be.undefined
    expect(vaultInvite.created_at_timestamp).to.not.be.undefined

    await deinitContactContext()
  })

  it('invites from trusted contact should be pending as trusted', async () => {
    const { contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)

    const invites = contactContext.vaultInvites.getCachedPendingInviteRecords()

    expect(invites[0].trusted).to.be.true

    await deinitContactContext()
  })

  it('invites from untrusted contact should be pending as untrusted', async () => {
    const { contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedAndUntrustedInvite(context)

    const invites = contactContext.vaultInvites.getCachedPendingInviteRecords()

    expect(invites[0].trusted).to.be.false

    await deinitContactContext()
  })

  it('invite should include delegated trusted contacts and add them when accepted', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext: party1Context, deinitThirdPartyContext: deinitParty1Context } =
      await Collaboration.inviteNewPartyToSharedVault(context, sharedVault)

    await Collaboration.acceptAllInvites(party1Context)

    const { thirdPartyContext: party2Context, deinitThirdPartyContext: deinitParty2Context } =
      await Collaboration.inviteNewPartyToSharedVault(context, sharedVault)

    const invites = party2Context.vaultInvites.getCachedPendingInviteRecords()

    const message = invites[0].message
    const delegatedContacts = message.data.trustedContacts
    expect(delegatedContacts.length).to.equal(3)

    expect(delegatedContacts.some((contact) => contact.contactUuid === context.userUuid)).to.be.true
    expect(delegatedContacts.some((contact) => contact.contactUuid === contactContext.userUuid)).to.be.true
    expect(delegatedContacts.some((contact) => contact.contactUuid === party1Context.userUuid)).to.be.true

    await Collaboration.acceptAllInvites(party2Context)

    const trustedContacts = party2Context.contacts.getAllContacts()
    expect(trustedContacts.length).to.equal(4)

    expect(trustedContacts.some((contact) => contact.contactUuid === context.userUuid)).to.be.true
    expect(trustedContacts.some((contact) => contact.contactUuid === contactContext.userUuid)).to.be.true
    expect(trustedContacts.some((contact) => contact.contactUuid === party1Context.userUuid)).to.be.true

    await deinitParty1Context()
    await deinitParty2Context()
    await deinitContactContext()
  })

  it('should sync a shared vault from scratch after accepting an invitation', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    const note = await context.createSyncedNote('foo', 'bar')
    await Collaboration.moveItemToVault(context, sharedVault, note)

    /** Create a mutually trusted contact */
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
    await contactContext.sync()

    await context.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      contact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

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
    await context.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      currentContextContact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

    await contactContext.vaultInvites.downloadInboundInvites()
    expect(contactContext.vaultInvites.getCachedPendingInviteRecords()[0].trusted).to.be.false

    await deinitContactContext()
  })

  it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
    await context.createSyncedNote('foo', 'bar')
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const sharedVault = await Collaboration.createSharedVault(context)

    const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await context.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      currentContextContact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

    await contactContext.vaultInvites.downloadInboundInvites()
    expect(contactContext.vaultInvites.getCachedPendingInviteRecords()[0].trusted).to.be.false

    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    expect(contactContext.vaultInvites.getCachedPendingInviteRecords()[0].trusted).to.be.true

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

    const preInvites = await contactContext.vaultInvites.downloadInboundInvites()
    expect(preInvites.length).to.equal(1)

    await context.vaultInvites.deleteInvite(invite)

    const postInvites = await contactContext.vaultInvites.downloadInboundInvites()
    expect(postInvites.length).to.equal(0)

    await deinitContactContext()
  })

  it('should delete all inbound invites after changing user password', async () => {
    /** Invites to user are encrypted with old keypair and are no longer decryptable */
    const { contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)

    const promise = contactContext.resolveWhenAllInboundSharedVaultInvitesAreDeleted()
    await contactContext.changePassword('new-password')
    await promise

    const invites = await contactContext.vaultInvites.downloadInboundInvites()
    expect(invites.length).to.equal(0)

    await deinitContactContext()
  })

  it('should fail to invite user if already member of shared vault', async () => {
    const { sharedVault, contact, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(
      context,
    )

    const result = await context.vaultInvites.inviteContactToSharedVault(
      sharedVault,
      contact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

    expect(result.isFailed()).to.be.true

    await deinitContactContext()
  })
})
