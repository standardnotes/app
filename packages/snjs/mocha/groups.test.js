import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('groups', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let groupService
  let contactService

  const createContactContext = async () => {
    const contactContext = await Factory.createAppContextWithRealCrypto()
    await contactContext.launch()
    await contactContext.register()

    return {
      contactContext,
      deinitContactContext: contactContext.deinit.bind(contactContext),
    }
  }

  const createContactForUserOfContext = async (contextAddingNewContact, contextImportingContactInfoFrom) => {
    const contact = await contextAddingNewContact.application.contactService.createTrustedContact({
      name: 'John Doe',
      publicKey: contextImportingContactInfoFrom.application.groupService.userPublicKey,
      userUuid: contextImportingContactInfoFrom.userUuid,
    })

    return contact
  }

  const acceptAllInvites = async (inContext) => {
    const invites = inContext.groupService.getPendingInvites()
    for (const invite of invites) {
      const result = await inContext.groupService.acceptInvite(invite)
      expect(result).to.be.true
    }
  }

  const createGroupWithAcceptedInvite = async () => {
    const group = await groupService.createGroup()
    const { contactContext, deinitContactContext } = await createContactContext()
    const contact = await createContactForUserOfContext(context, contactContext)
    await groupService.inviteContactToGroup(group, contact, GroupPermission.Write)
    await contactContext.sync()

    await createContactForUserOfContext(contactContext, context)
    await acceptAllInvites(contactContext)

    return { group, contact, contactContext, deinitContactContext }
  }

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    application = context.application
    groupService = application.groupService
    contactService = application.contactService
  })

  describe('registration', () => {
    it('should create keypair during registration', () => {
      expect(groupService.userPublicKey).to.not.be.undefined
      expect(groupService.userDecryptedPrivateKey).to.not.be.undefined
    })
  })

  describe('contacts', () => {
    it('should create contact', async () => {
      const contact = await contactService.createTrustedContact({
        name: 'John Doe',
        publicKey: 'my_public_key',
        userUuid: '123',
      })

      expect(contact).to.not.be.undefined
      expect(contact.name).to.equal('John Doe')
      expect(contact.publicKey).to.equal('my_public_key')
      expect(contact.userUuid).to.equal('123')
    })

    it('performing a sync should download new contact changes', async () => {})

    it('contact changes should be pending and untrusted until accepted by the user', async () => {})

    it('should mark a contact as untrusted when their public key changes', async () => {})
  })

  describe('groups', () => {
    it('should create a group', async () => {
      const group = await groupService.createGroup()
      expect(group).to.not.be.undefined

      const sharedItemsKeys = application.items.getSharedItemsKeysForGroup(group.uuid)
      expect(sharedItemsKeys.length).to.equal(1)

      const sharedItemsKey = sharedItemsKeys[0]
      expect(sharedItemsKey instanceof SharedItemsKey).to.be.true
      expect(sharedItemsKey.group_uuid).to.equal(group.uuid)
    })

    it('should add item to group', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const group = await groupService.createGroup()

      await groupService.addItemToGroup(group, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.group_uuid).to.equal(group.uuid)
    })

    it('should add item to group with contact', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { group, deinitContactContext } = await createGroupWithAcceptedInvite()

      await groupService.addItemToGroup(group, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.group_uuid).to.equal(group.uuid)

      await deinitContactContext()
    })

    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      await createContactForUserOfContext(contactContext, context)
      const currentContextContact = await createContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await groupService.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)
      await groupService.addItemToGroup(group, note)

      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      contactContext.unlockSyncing()
      await contactContext.sync()
      await acceptAllInvites(contactContext)
      await promise

      const receivedItemsKey = contactContext.application.items.getSharedItemsKeysForGroup(group.uuid)[0]
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('should sync a group from scratch after accepting a group invitation', async () => {
      const group = await groupService.createGroup()

      /** Create an item and add it to the group */
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)

      /** Invite a contact */
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(context, contactContext)
      await createContactForUserOfContext(contactContext, context)

      /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
      await contactContext.sync()

      await groupService.inviteContactToGroup(group, contact, GroupPermission.Write)

      /** Contact should now sync and expect to find note */
      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      await contactContext.sync()
      await acceptAllInvites(contactContext)
      await promise

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('should remove group member', () => {})
  })

  describe('invites', () => {
    it('should invite contact to group', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(context, contactContext)

      const groupInvite = await groupService.inviteContactToGroup(group, contact, GroupPermission.Write)

      expect(groupInvite).to.not.be.undefined
      expect(groupInvite.group_uuid).to.equal(group.uuid)
      expect(groupInvite.user_uuid).to.equal(contact.userUuid)
      expect(groupInvite.encrypted_group_key).to.not.be.undefined
      expect(groupInvite.inviter_public_key).to.equal(groupService.userPublicKey)
      expect(groupInvite.permissions).to.equal(GroupPermission.Write)
      expect(groupInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      const currentContextContact = await createContactForUserOfContext(context, contactContext)
      await groupService.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)

      await contactContext.groupService.downloadInboundInvites()
      expect(contactContext.groupService.isInviteTrusted(contactContext.groupService.getPendingInvites()[0])).to.be
        .false

      await deinitContactContext()
    })

    it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      const currentContextContact = await createContactForUserOfContext(context, contactContext)
      await groupService.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)

      await contactContext.groupService.downloadInboundInvites()
      expect(contactContext.groupService.isInviteTrusted(contactContext.groupService.getPendingInvites()[0])).to.be
        .false

      await createContactForUserOfContext(contactContext, context)

      expect(contactContext.groupService.isInviteTrusted(contactContext.groupService.getPendingInvites()[0])).to.be.true

      await deinitContactContext()
    })
  })

  describe('permissions', () => {
    it('non-admin user should not be able to create or update shared items keys with the server', () => {})

    it("writer user should not be able to change an item using an items key that does not match the group's specified items key", () => {})

    it('read user should not be able to make changes to items', () => {})
  })

  describe('user credentials change', () => {
    it('should reupload all outbound invites when inviter keypair changes', async () => {})

    it('should reupload encrypted private key when changing my password', async () => {})
  })

  describe('group key rotation', () => {
    it("rotating a group's key should send a key-change invite to all members", async () => {})

    it("rotating a group's key should reupload all outbound invites for that group", async () => {})

    it('should rotate group key after removing group member', () => {})

    it('should not process inbound key-change invites if the public key of the invite does not match contact public key', () => {})
  })
})
