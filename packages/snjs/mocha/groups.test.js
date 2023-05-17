import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('groups', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let groupService

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
  })

  describe('registration', () => {
    it('should create keypair during registration', () => {
      expect(groupService.userPublicKey).to.not.be.undefined
      expect(groupService.userDecryptedPrivateKey).to.not.be.undefined
    })
  })

  describe('contacts', () => {
    it('should create contact', async () => {
      const contact = await groupService.createContact({
        name: 'John Doe',
        publicKey: 'my_public_key',
        userUuid: '123',
        trusted: true,
      })

      expect(contact).to.not.be.undefined
      expect(contact.name).to.equal('John Doe')
      expect(contact.publicKey).to.equal('my_public_key')
      expect(contact.userUuid).to.equal('123')
      expect(contact.trusted).to.be.true
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

    const createContactForUserOfContext = async (otherContext) => {
      const contact = await groupService.createContact({
        name: 'John Doe',
        publicKey: otherContext.application.groupService.userPublicKey,
        userUuid: otherContext.userUuid,
        trusted: true,
      })

      return contact
    }

    const createGroupWithInvitedContact = async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(contactContext)
      await groupService.addContactToGroup(group, contact, GroupPermission.Write)
      await contactContext.sync()

      return { group, contact, contactContext, deinitContactContext }
    }

    it('should create a group', async () => {
      const group = await groupService.createGroup()
      expect(group).to.not.be.undefined

      const sharedItemsKeys = application.items.sharedItemsKeysForGroup(group.uuid)
      expect(sharedItemsKeys.length).to.equal(1)

      const sharedItemsKey = sharedItemsKeys[0]
      expect(sharedItemsKey instanceof SharedItemsKey).to.be.true
      expect(sharedItemsKey.group_uuid).to.equal(group.uuid)
    })

    it('should add contact to group', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(contactContext)

      const groupUser = await groupService.addContactToGroup(group, contact, GroupPermission.Write)

      expect(groupUser).to.not.be.undefined
      expect(groupUser.group_uuid).to.equal(group.uuid)
      expect(groupUser.user_uuid).to.equal(contact.userUuid)
      expect(groupUser.encrypted_group_key).to.not.be.undefined
      expect(groupUser.sender_public_key).to.equal(groupService.userPublicKey)
      expect(groupUser.permissions).to.equal(GroupPermission.Write)
      expect(groupUser.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('should add item to group', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { group, deinitContactContext } = await createGroupWithInvitedContact()

      await groupService.addItemToGroup(group, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.group_uuid).to.equal(group.uuid)

      await deinitContactContext()
    })

    it('should sync group note with receiving contact', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { group, contactContext, deinitContactContext } = await createGroupWithInvitedContact()

      await contactContext.sync()
      await groupService.addItemToGroup(group, note)
      await context.sync()

      await contactContext.sync()

      const receivedItemsKey = contactContext.application.items.sharedItemsKeysForGroup(group.uuid)[0]
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.group_uuid).to.equal(group.uuid)
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.group_uuid).to.equal(group.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it.only('should sync a group from scratch when receiving a group invitation', async () => {
      const group = await groupService.createGroup()

      /** Create an item and add it to the group */
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)

      /** Invite a contact */
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createContactForUserOfContext(contactContext)

      /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
      await contactContext.sync()

      await groupService.addContactToGroup(group, contact, GroupPermission.Write)

      /** Contact should now sync and expect to find note */
      await contactContext.sync()
      await contactContext.awaitNextSyncGroupFromScratchEvent()
      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined

      await deinitContactContext()
    })

    it('changing a groups key should reencrypt the group key for all users', async () => {})
  })
})
