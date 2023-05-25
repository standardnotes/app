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

  const createTrustedContactForUserOfContext = async (contextAddingNewContact, contextImportingContactInfoFrom) => {
    const contact = await contextAddingNewContact.application.contactService.createTrustedContact({
      name: 'John Doe',
      publicKey: contextImportingContactInfoFrom.application.groupService.userPublicKey,
      contactUuid: contextImportingContactInfoFrom.userUuid,
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

  const createGroupWithAcceptedInvite = async (permissions = GroupPermission.Write) => {
    const { group, contact, contactContext, deinitContactContext } = await createGroupWithUnacceptedButTrustedInvite(
      permissions,
    )
    await acceptAllInvites(contactContext)

    await contactContext.awaitNextSyncGroupFromScratchEvent()

    return { group, contact, contactContext, deinitContactContext }
  }

  const createGroupWithAcceptedInviteAndNote = async (permissions = GroupPermission.Write) => {
    const { group, contactContext, contact, deinitContactContext } = await createGroupWithAcceptedInvite(permissions)
    const note = await context.createSyncedNote('foo', 'bar')
    await groupService.addItemToGroup(group, note)
    await contactContext.sync()
    return { group, note, contact, contactContext, deinitContactContext }
  }

  const createGroupWithUnacceptedButTrustedInvite = async (permissions = GroupPermission.Write) => {
    const group = await groupService.createGroup()
    const { contactContext, deinitContactContext } = await createContactContext()
    const contact = await createTrustedContactForUserOfContext(context, contactContext)
    await groupService.inviteContactToGroup(group, contact, permissions)
    await contactContext.sync()

    await createTrustedContactForUserOfContext(contactContext, context)

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

  describe('authentication', () => {
    it('should create keypair during registration', () => {
      expect(groupService.userPublicKey).to.not.be.undefined
      expect(groupService.userDecryptedPrivateKey).to.not.be.undefined
    })

    it('should populate keypair during sign in', async () => {
      const email = context.email
      const password = context.password
      await context.signout()

      const recreatedContext = await Factory.createAppContextWithRealCrypto()
      await recreatedContext.launch()
      recreatedContext.email = email
      recreatedContext.password = password
      await recreatedContext.signIn()

      expect(recreatedContext.groupService.userPublicKey).to.not.be.undefined
      expect(recreatedContext.groupService.userDecryptedPrivateKey).to.not.be.undefined
    })

    it('should rotate keypair during password change', async () => {
      const oldPublicKey = groupService.userPublicKey
      const oldPrivateKey = groupService.userDecryptedPrivateKey

      await context.changePassword('new_password')

      expect(groupService.userPublicKey).to.not.be.undefined
      expect(groupService.userDecryptedPrivateKey).to.not.be.undefined
      expect(groupService.userPublicKey).to.not.equal(oldPublicKey)
      expect(groupService.userDecryptedPrivateKey).to.not.equal(oldPrivateKey)
    })

    it('should reupload encrypted private key when changing my password', async () => {
      const oldEncryptedPrivateKey = groupService.userEncryptedPrivateKey

      await context.changePassword('new_password')

      const user = await context.application.sessions.getUserFromServer()

      expect(user.encrypted_private_key).to.not.be.undefined
      expect(user.encrypted_private_key).to.not.equal(oldEncryptedPrivateKey)
    })

    it('should allow option to enable collaboration for previously signed in accounts', async () => {
      const newContext = await Factory.createAppContextWithRealCrypto()
      await newContext.launch()

      const objectToSpy = newContext.application.sessions.userApiService

      sinon.stub(objectToSpy, 'register').callsFake(async (params) => {
        const modifiedParams = {
          ...params,
          publicKey: undefined,
          encryptedPrivateKey: undefined,
        }

        objectToSpy.register.restore()
        const result = await objectToSpy.register(modifiedParams)
        return result
      })

      await newContext.register()

      expect(newContext.application.sessions.isUserMissingKeypair()).to.be.true

      await newContext.application.sessions.updateAccountWithFirstTimeKeypair()

      expect(newContext.application.sessions.isUserMissingKeypair()).to.be.false
    })
  })

  describe('contacts', () => {
    it('should create contact', async () => {
      const contact = await contactService.createTrustedContact({
        name: 'John Doe',
        publicKey: 'my_public_key',
        contactUuid: '123',
      })

      expect(contact).to.not.be.undefined
      expect(contact.name).to.equal('John Doe')
      expect(contact.publicKey).to.equal('my_public_key')
      expect(contact.contactUuid).to.equal('123')
    })

    it('performing a sync should download new contact changes and keep them pending', async () => {
      const { contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const originalContact = context.contacts.findTrustedContact(contactContext.userUuid)

      const oldPublicKey = contactContext.publicKey
      await contactContext.changePassword('new_password')
      await context.sync()
      const newPublicKey = contactContext.publicKey

      expect(oldPublicKey).to.not.equal(newPublicKey)

      const serverContacts = context.contacts.getServerContacts()
      expect(serverContacts.length).to.equal(1)
      expect(serverContacts[0].contact_public_key).to.not.equal(originalContact.publicKey)
      expect(serverContacts[0].contact_public_key).to.equal(contactContext.publicKey)

      const unchangedTrustedContent = context.contacts.findTrustedContact(contactContext.userUuid)
      expect(originalContact.publicKey).to.equal(unchangedTrustedContent.publicKey)
      expect(unchangedTrustedContent.publicKey).to.not.equal(serverContacts[0].contact_public_key)

      await deinitContactContext()
    })

    it('should update trusted contact model when accepting incoming contact change', async () => {
      const { contactContext, deinitContactContext } = await createContactContext()
      await createTrustedContactForUserOfContext(context, contactContext)
      await createTrustedContactForUserOfContext(contactContext, context)

      const originalContactRecord = context.contacts.findTrustedContact(contactContext.userUuid)

      await contactContext.changePassword('new_password')
      await context.sync()

      const pendingRequests = context.contacts.getServerContacts()
      expect(pendingRequests.length).to.equal(1)
      expect(pendingRequests[0].contact_public_key).to.equal(contactContext.publicKey)

      await context.contacts.trustServerContact(pendingRequests[0])

      const updatedContactRecord = context.contacts.findTrustedContact(contactContext.userUuid)
      expect(updatedContactRecord).to.not.be.undefined
      expect(updatedContactRecord.publicKey).to.not.equal(originalContactRecord.publicKey)
      expect(updatedContactRecord.publicKey).to.equal(contactContext.publicKey)

      await deinitContactContext()
    })
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

    it('should sync a group from scratch after accepting a group invitation', async () => {
      const group = await groupService.createGroup()

      /** Create an item and add it to the group */
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)

      /** Invite a contact */
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)
      await createTrustedContactForUserOfContext(contactContext, context)

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

    it('should remove group member', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const originalGroupUsers = await groupService.getGroupUsers(group.uuid)
      expect(originalGroupUsers.length).to.equal(2)

      const result = await groupService.removeUserFromGroup(group.uuid, contactContext.userUuid)

      expect(isClientDisplayableError(result)).to.be.false

      const updatedGroupUsers = await groupService.getGroupUsers(group.uuid)
      expect(updatedGroupUsers.length).to.equal(1)

      await deinitContactContext()
    })

    it('should return invited to groups when fetching groups from server', async () => {
      const { contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const groups = await contactContext.groupService.reloadGroups()

      expect(groups.length).to.equal(1)

      await deinitContactContext()
    })

    it('should delete a group and remove item associations', async () => {
      const { group, note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await groupService.deleteGroup(group.uuid)

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote.group_uuid).to.not.be.ok

      /** Contact should not be able to receive new changes, and thus will have the last copy of the note with its group_uuid intact */
      const contactNote = contactContext.application.items.findItem(note.uuid)
      expect(contactNote.group_uuid).to.not.be.undefined

      await deinitContactContext()
    })

    it('should update group name and description', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      await groupService.changeGroupMetadata(group.uuid, {
        name: 'new group name',
        description: 'new group description',
      })

      const groupInfo = groupService.getGroupInfo(group.uuid)
      expect(groupInfo.groupName).to.equal('new group name')
      expect(groupInfo.groupDescription).to.equal('new group description')

      await contactContext.sync()

      const contactGroupInfo = contactContext.groupService.getGroupInfo(group.uuid)
      expect(contactGroupInfo.groupName).to.equal('new group name')
      expect(contactGroupInfo.groupDescription).to.equal('new group description')

      await deinitContactContext()
    })
  })

  describe('client timing', () => {
    it('should load data in the correct order at startup to allow shared items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const group = await groupService.createGroup()
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)
      await context.deinit()

      const recreatedContext = await Factory.createAppContextWithRealCrypto(appIdentifier)
      await recreatedContext.launch()

      const updatedNote = recreatedContext.application.items.findItem(note.uuid)
      expect(updatedNote.title).to.equal('foo')
      expect(updatedNote.text).to.equal('bar')
    })
  })

  describe('item collaboration', () => {
    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      await createTrustedContactForUserOfContext(contactContext, context)
      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)

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

    it('group creator should receive changes from other members', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)
      await contactContext.sync()

      await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
        mutator.title = 'new title'
      })
      await contactContext.sync()
      await context.sync()

      const receivedNote = context.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('new title')

      await deinitContactContext()
    })

    it('should remove an item from a group; collaborator should no longer receive changes', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.groupService.removeItemFromItsGroup(note)

      await context.changeNoteTitleAndSync(note, 'new title')

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.not.equal('new title')
      expect(receivedNote.title).to.equal(note.title)

      await deinitContactContext()
    })

    it('should remove item from collaborated account when item is deleted permanently', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.items.setItemToBeDeleted(note)
      await context.sync()
      await contactContext.sync()

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote).to.be.undefined

      const collaboratorNote = contactContext.application.items.findItem(note.uuid)
      expect(collaboratorNote).to.be.undefined

      await deinitContactContext()
    })

    it('attempting to delete a note received by and already deleted by another person should not cause infinite conflicts', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.items.setItemToBeDeleted(note)
      await contactContext.items.setItemToBeDeleted(note)

      await context.sync()
      await contactContext.sync()

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote).to.be.undefined

      const collaboratorNote = contactContext.application.items.findItem(note.uuid)
      expect(collaboratorNote).to.be.undefined

      await deinitContactContext()
    })

    it('conflicts created should be associated with the group', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.changeNoteTitle(note, 'new title first client')
      await contactContext.changeNoteTitle(note, 'new title second client')

      await context.sync()
      await contactContext.sync()
      await context.sync()

      const originatorNotes = context.items.getDisplayableNotes()
      expect(originatorNotes.length).to.equal(2)
      expect(originatorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

      const collaboratorNotes = contactContext.items.getDisplayableNotes()
      expect(collaboratorNotes.length).to.equal(2)
      expect(collaboratorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

      await deinitContactContext()
    })
  })

  describe('invites', () => {
    it('should invite contact to group', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)

      const groupInvite = await groupService.inviteContactToGroup(group, contact, GroupPermission.Write)

      expect(groupInvite).to.not.be.undefined
      expect(groupInvite.group_uuid).to.equal(group.uuid)
      expect(groupInvite.user_uuid).to.equal(contact.contactUuid)
      expect(groupInvite.encrypted_group_data).to.not.be.undefined
      expect(groupInvite.inviter_public_key).to.equal(groupService.userPublicKey)
      expect(groupInvite.permissions).to.equal(GroupPermission.Write)
      expect(groupInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const group = await groupService.createGroup()

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
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

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
      await groupService.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)

      await contactContext.groupService.downloadInboundInvites()
      expect(contactContext.groupService.isInviteTrusted(contactContext.groupService.getPendingInvites()[0])).to.be
        .false

      await createTrustedContactForUserOfContext(contactContext, context)

      expect(contactContext.groupService.isInviteTrusted(contactContext.groupService.getPendingInvites()[0])).to.be.true

      await deinitContactContext()
    })
  })

  describe('user credentials change', () => {
    it('should reupload all outbound invites when inviter keypair changes', async () => {
      const group = await groupService.createGroup()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)
      await groupService.inviteContactToGroup(group, contact, GroupPermission.Write)
      await contactContext.sync()

      const groupInvite = contactContext.groupService.getPendingInvites()[0]
      expect(groupInvite.inviter_public_key).to.equal(groupService.userPublicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedGroupInvite = contactContext.groupService.getPendingInvites()[0]
      expect(updatedGroupInvite.inviter_public_key).to.equal(groupService.userPublicKey)

      await deinitContactContext()
    })
  })

  describe('group key rotation', () => {
    it("rotating a group's key should send a key-change invite to all members", async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      await groupService.rotateGroupKey(group.uuid)

      const outboundInvites = await groupService.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.group_uuid).to.equal(group.uuid)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_group_data).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(groupService.userPublicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a group's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithUnacceptedButTrustedInvite()
      contactContext.lockSyncing()

      const originalOutboundInvites = await groupService.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncGroupData = originalOutboundInvites[0].encrypted_group_data

      await groupService.rotateGroupKey(group.uuid)

      const updatedOutboundInvites = await groupService.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(1)

      const joinInvite = updatedOutboundInvites[0]
      expect(joinInvite.invite_type).to.equal('join')
      expect(joinInvite.encrypted_group_data).to.not.be.undefined
      expect(joinInvite.encrypted_group_data).to.not.equal(originalEncGroupData)

      await deinitContactContext()
    })

    it('should update both pending join and key-change invites instead of creating new ones', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      const thirdParty = await createContactContext()
      const thirdPartyContact = await createTrustedContactForUserOfContext(context, thirdParty.contactContext)
      await groupService.inviteContactToGroup(group, thirdPartyContact, GroupPermission.Write)

      const originalOutboundInvites = await groupService.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await groupService.rotateGroupKey(group.uuid)

      const updatedOutboundInvites = await groupService.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(2)

      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'join')).to.not.be.undefined
      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'key-change')).to.not.be.undefined

      await deinitContactContext()
      await thirdParty.deinitContactContext()
    })

    it('key change invites should be automatically accepted by trusted contacts', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      await groupService.rotateGroupKey(group.uuid)

      const acceptInviteSpy = sinon.spy(contactContext.groupService, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate group key after removing group member', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const originalGroupKey = groupService.getGroupKey(group.uuid)

      await groupService.removeUserFromGroup(group.uuid, contactContext.userUuid)

      const newGroupKey = groupService.getGroupKey(group.uuid)

      expect(newGroupKey.keyTimestamp).to.be.greaterThan(originalGroupKey.keyTimestamp)
      expect(newGroupKey.groupKey).to.not.equal(originalGroupKey.groupKey)

      await deinitContactContext()
    })

    it('should keep group key with greater keyTimestamp if conflict', async () => {
      const group = await groupService.createGroup()
      const groupKey = groupService.getGroupKey(group.uuid)

      const otherClient = await Factory.createAppContextWithRealCrypto()
      await otherClient.launch()
      otherClient.email = context.email
      otherClient.password = context.password
      await otherClient.signIn(context.email, context.password)

      context.lockSyncing()
      otherClient.lockSyncing()

      const olderTimestamp = groupKey.keyTimestamp + 1
      const newerTimestamp = groupKey.keyTimestamp + 2

      await context.application.items.changeItem(groupKey, (mutator) => {
        mutator.content = {
          groupKey: 'new-group-key',
          keyTimestamp: olderTimestamp,
        }
      })

      const otherGroupKey = otherClient.groupService.getGroupKey(group.uuid)
      await otherClient.application.items.changeItem(otherGroupKey, (mutator) => {
        mutator.content = {
          groupKey: 'new-group-key',
          keyTimestamp: newerTimestamp,
        }
      })

      context.unlockSyncing()
      otherClient.unlockSyncing()

      await otherClient.sync()
      await context.sync()

      expect(context.items.getItems(ContentType.GroupKey).length).to.equal(1)
      expect(otherClient.items.getItems(ContentType.GroupKey).length).to.equal(1)

      const groupKeyAfterSync = context.groupService.getGroupKey(group.uuid)
      const otherGroupKeyAfterSync = otherClient.groupService.getGroupKey(group.uuid)

      expect(groupKeyAfterSync.keyTimestamp).to.equal(otherGroupKeyAfterSync.keyTimestamp)
      expect(groupKeyAfterSync.groupKey).to.equal(otherGroupKeyAfterSync.groupKey)
      expect(groupKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
      expect(otherGroupKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

      await otherClient.deinit()
    })
  })

  describe('permissions', async () => {
    it('should not be able to update a group with a keyTimestamp lower than the current one', async () => {
      const group = await groupService.createGroup()
      const groupKey = groupService.getGroupKey(group.uuid)

      const result = await groupService.updateGroup(group.uuid, {
        groupKeyTimestamp: groupKey.keyTimestamp - 1,
        specifiedItemsKeyUuid: '123',
      })

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('non-admin user should not be able to create or update shared items keys with the server', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const sharedItemsKey = contactContext.items.getSharedItemsKeysForGroup(group.uuid)[0]

      await contactContext.items.changeItem(sharedItemsKey, () => {})
      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()

      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(1)
      expect(rejectedPayloads[0].content_type).to.equal(ContentType.SharedItemsKey)

      await deinitContactContext()
    })

    it("group user should not be able to change an item using an items key that does not match the group's specified items key", async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)
      await contactContext.sync()

      const newItemsKeyUuid = UuidGenerator.GenerateUuid()
      const newItemsKey = contactContext.encryption.createSharedItemsKey(newItemsKeyUuid, group.uuid)
      await contactContext.items.insertItem(newItemsKey)

      const contactGroup = contactContext.groupService.groupStorage.getGroup(group.uuid)
      contactContext.groupService.groupStorage.setGroup(group.uuid, {
        ...contactGroup,
        specifiedItemsKeyUuid: newItemsKeyUuid,
      })

      await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
        mutator.title = 'new title'
      })

      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()
      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(2)
      expect(rejectedPayloads.find((payload) => payload.content_type === ContentType.Note)).to.not.be.undefined
      expect(rejectedPayloads.find((payload) => payload.content_type === ContentType.SharedItemsKey)).to.not.be
        .undefined

      await deinitContactContext()
    })

    it('read user should not be able to make changes to items', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(GroupPermission.Read)
      const note = await context.createSyncedNote('foo', 'bar')
      await groupService.addItemToGroup(group, note)
      await contactContext.sync()

      await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
        mutator.title = 'new title'
      })

      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()
      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(1)
      expect(rejectedPayloads[0].content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })
  })
})
