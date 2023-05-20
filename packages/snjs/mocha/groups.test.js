import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('groups', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let groupService
  let contactService

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
      const contact = await contactService.createContact({
        name: 'John Doe',
        publicKey: 'my_public_key',
        userUuid: '123',
        trusted: true,
      })

      expect(contact).to.not.be.undefined
      expect(contact.name).to.equal('John Doe')
      expect(contact.publicKey).to.equal('my_public_key')
      expect(contact.userUuid).to.equal('123')
    })

    it('should mark a contact as untrusted when their public key changes', async () => {})
  })

  describe('groups', () => {
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
      const contact = await contextAddingNewContact.application.contactService.createContact({
        name: 'John Doe',
        publicKey: contextImportingContactInfoFrom.application.groupService.userPublicKey,
        userUuid: contextImportingContactInfoFrom.userUuid,
        trusted: true,
      })

      return contact
    }

    const createGroupWithInvitedContact = async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(context, contactContext)
      await groupService.addContactToGroup(group, contact, GroupPermission.Write)
      await contactContext.sync()

      return { group, contact, contactContext, deinitContactContext }
    }

    it('should create a group', async () => {
      const group = await groupService.createGroup()
      expect(group).to.not.be.undefined

      const sharedItemsKeys = application.items.getSharedItemsKeysForGroup(group.uuid)
      expect(sharedItemsKeys.length).to.equal(1)

      const sharedItemsKey = sharedItemsKeys[0]
      expect(sharedItemsKey instanceof SharedItemsKey).to.be.true
      expect(sharedItemsKey.group_uuid).to.equal(group.uuid)
    })

    it('adding a contact to a group should be trusted to current context and untrusted to other context', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()

      const contactContextCallPromise = new Promise((resolve) => {
        contactContext.application.groupService.promptUserForUntrustedUserKeys = () => {
          resolve()
        }
      })

      const currentContextSpyCount = sinon.spy(groupService, 'promptUserForUntrustedUserKeys')

      const contact = await createContactForUserOfContext(context, contactContext)
      await groupService.addContactToGroup(group, contact, GroupPermission.Write)
      await contactContext.sync()

      expect(currentContextSpyCount.callCount).to.equal(0)

      await contactContextCallPromise

      await deinitContactContext()
    })

    it('should add contact to group', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(context, contactContext)

      const groupUser = await groupService.addContactToGroup(group, contact, GroupPermission.Write)

      expect(groupUser).to.not.be.undefined
      expect(groupUser.group_uuid).to.equal(group.uuid)
      expect(groupUser.user_uuid).to.equal(contact.userUuid)
      expect(groupUser.encrypted_group_key).to.not.be.undefined
      expect(groupUser.inviter_public_key).to.equal(groupService.userPublicKey)
      expect(groupUser.permissions).to.equal(GroupPermission.Write)
      expect(groupUser.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
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
      const { group, deinitContactContext } = await createGroupWithInvitedContact()

      await groupService.addItemToGroup(group, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.group_uuid).to.equal(group.uuid)

      await deinitContactContext()
    })

    it('received items from untrusted contact should not be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { group, contactContext, deinitContactContext } = await createGroupWithInvitedContact()

      await contactContext.sync()
      await groupService.addItemToGroup(group, note)
      await context.sync()

      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      await contactContext.application.groupService.syncGroupsFromScratch([group.uuid])
      await promise

      const receivedItemsKey = contactContext.application.items.invalidItems.find(
        (item) => item.content_type === ContentType.SharedItemsKey,
      )
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.group_uuid).to.equal(group.uuid)
      expect(receivedItemsKey.errorDecrypting).to.be.true

      const receivedNote = contactContext.application.items.invalidItems.find((item) => item.uuid === note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.group_uuid).to.equal(group.uuid)
      expect(receivedNote.errorDecrypting).to.be.true

      await deinitContactContext()
    })

    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      await createContactForUserOfContext(contactContext, context)
      const currentContextContact = await createContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await groupService.addContactToGroup(group, currentContextContact, GroupPermission.Write)
      await groupService.addItemToGroup(group, note)

      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      contactContext.unlockSyncing()
      await contactContext.sync()
      await promise

      const receivedItemsKey = contactContext.application.items.getSharedItemsKeysForGroup(group.uuid)[0]
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('received items from contact who becomes trusted after receipt of items should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      const currentContextContact = await createContactForUserOfContext(context, contactContext)

      await groupService.addContactToGroup(group, currentContextContact, GroupPermission.Write)
      await groupService.addItemToGroup(group, note)

      await contactContext.sync()
      await groupService.addItemToGroup(group, note)
      await context.sync()

      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      await contactContext.application.groupService.syncGroupsFromScratch([group.uuid])
      await promise

      const keysResolvedPromise = contactContext.resolveWhenGroupUserKeysResolved()
      await createContactForUserOfContext(contactContext, context)
      await keysResolvedPromise

      const receivedItemsKey = contactContext.application.items.getSharedItemsKeysForGroup(group.uuid)[0]
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('should sync a group from scratch when receiving a group invitation', async () => {
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

      await groupService.addContactToGroup(group, contact, GroupPermission.Write)

      /** Contact should now sync and expect to find note */
      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      await contactContext.sync()
      await promise

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined

      await deinitContactContext()
    })

    it('should reupload all group users keys for me when my globak keypair changes', async () => {

    })

    it('should reupload encrypted private key when changing my password', async () => {

    })

    it('should remove group member', () => {})

    it('changing a groups key should reencrypt the group key for all users', async () => {})

    it('should rotate key after removing group member', () => {})
  })
})
