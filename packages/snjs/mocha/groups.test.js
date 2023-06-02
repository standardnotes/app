import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'
import * as Collaboration from './lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('groups', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaults
  let groups

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
    vaults = application.vaults
    groups = context.groups
  })

  const createGroupWithAcceptedInvite = async (permissions = GroupPermission.Write) => {
    const { vaultSystemIdentifier, group, contact, contactContext, deinitContactContext } =
      await createGroupWithUnacceptedButTrustedInvite(permissions)

    await Collaboration.acceptAllInvites(contactContext)

    await contactContext.awaitNextSyncGroupFromScratchEvent()

    return { vaultSystemIdentifier, group, contact, contactContext, deinitContactContext }
  }

  const createGroupWithAcceptedInviteAndNote = async (permissions = GroupPermission.Write) => {
    const { vaultSystemIdentifier, group, contactContext, contact, deinitContactContext } =
      await createGroupWithAcceptedInvite(permissions)
    const note = await context.createSyncedNote('foo', 'bar')
    await addItemToVault(context, vaultSystemIdentifier, note)
    await contactContext.sync()
    return { vaultSystemIdentifier, group, note, contact, contactContext, deinitContactContext }
  }

  const createGroupWithUnacceptedButTrustedInvite = async (permissions = GroupPermission.Write) => {
    const vaultSystemIdentifier = await vaults.createVault()
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    const group = await groups.createGroup({ vaultSystemIdentifier })

    const invite = await groups.inviteContactToGroup(group, contact, permissions)
    await contactContext.sync()

    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    return { vaultSystemIdentifier, group, contact, contactContext, deinitContactContext, invite }
  }

  const createVaultAndGroup = async () => {
    const vaultSystemIdentifier = await vaults.createVault()
    const group = await groups.createGroup({ vaultSystemIdentifier })
    return { vaultSystemIdentifier, group }
  }

  const addItemToVault = async (contextToAddTo, vaultSystemIdentifier, item) => {
    const promise = contextToAddTo.resolveWhenItemCompletesAddingToGroup(item)
    await contextToAddTo.vaults.addItemToVault(vaultSystemIdentifier, item)
    await promise
  }

  describe('shared vaults via groups', () => {
    it('should add item to group with no other members', async () => {
      const note = await context.createSyncedNote('foo', 'bar')

      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      await addItemToVault(context, vaultSystemIdentifier, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_system_identifier).to.equal(vaultSystemIdentifier)
      expect(updatedNote.group_uuid).to.equal(group.uuid)
    })

    it('should add item to group with contact', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { vaultSystemIdentifier, deinitContactContext } = await createGroupWithAcceptedInvite()

      await addItemToVault(context, vaultSystemIdentifier, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_system_identifier).to.equal(vaultSystemIdentifier)

      await deinitContactContext()
    })

    it('should sync a group from scratch after accepting an invitation', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, vaultSystemIdentifier, note)

      /** Create a mutually trusted contact */
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

      /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
      await contactContext.sync()

      await groups.inviteContactToGroup(group, contact, GroupPermission.Write)

      /** Contact should now sync and expect to find note */
      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      await contactContext.sync()
      await Collaboration.acceptAllInvites(contactContext)
      await promise

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('should remove group member', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const originalGroupUsers = await groups.getGroupUsers(group.uuid)
      expect(originalGroupUsers.length).to.equal(2)

      const result = await groups.removeUserFromGroup(group.uuid, contactContext.userUuid)

      expect(isClientDisplayableError(result)).to.be.false

      const updatedGroupUsers = await groups.getGroupUsers(group.uuid)
      expect(updatedGroupUsers.length).to.equal(1)

      await deinitContactContext()
    })

    it('non-admin user should not be able to invite user', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const thirdParty = await Collaboration.createContactContext()
      const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
        contactContext,
        thirdParty.contactContext,
      )
      const result = await contactContext.groups.inviteContactToGroup(group, thirdPartyContact, GroupPermission.Write)

      expect(isClientDisplayableError(result)).to.be.true

      await deinitContactContext()
    })

    it('should not be able to leave group as creator', async () => {
      const { group } = await createVaultAndGroup()

      const result = await groups.removeUserFromGroup(group.uuid, context.userUuid)

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('should be able to leave group as added admin', async () => {
      const { group, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(GroupPermission.Admin)

      const result = await contactContext.groups.leaveGroup(group.uuid)

      expect(isClientDisplayableError(result)).to.be.false

      await deinitContactContext()
    })

    it('leaving a group should remove its items locally', async () => {
      const { group, note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote(
        GroupPermission.Admin,
      )

      const originalNote = contactContext.application.items.findItem(note.uuid)
      expect(originalNote).to.not.be.undefined

      await contactContext.groups.leaveGroup(group.uuid)

      const updatedContactNote = contactContext.application.items.findItem(note.uuid)
      expect(updatedContactNote).to.be.undefined

      await deinitContactContext()
    })

    it('leaving or being removed from group should remove group items locally', async () => {
      const { group, note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const contactNote = contactContext.application.items.findItem(note.uuid)
      expect(contactNote).to.not.be.undefined

      await context.groups.removeUserFromGroup(group.uuid, contactContext.userUuid)

      await contactContext.sync()
      await contactContext.groups.reloadRemovedGroups()

      const updatedContactNote = contactContext.application.items.findItem(note.uuid)
      expect(updatedContactNote).to.be.undefined

      await deinitContactContext()
    })

    it('should return invited to groups when fetching groups from server', async () => {
      const { contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const groups = await contactContext.groups.reloadRemoteGroups()

      expect(groups.length).to.equal(1)

      await deinitContactContext()
    })

    it('canceling an invite should remove it from recipient pending invites', async () => {
      const { invite, contactContext, deinitContactContext } = await createGroupWithUnacceptedButTrustedInvite()

      const preInvites = await contactContext.groups.downloadInboundInvites()
      expect(preInvites.length).to.equal(1)

      await groups.deleteInvite(invite)

      const postInvites = await contactContext.groups.downloadInboundInvites()
      expect(postInvites.length).to.equal(0)

      await deinitContactContext()
    })

    it('should update vault name and description', async () => {
      const { vaultSystemIdentifier, group, contactContext, deinitContactContext } =
        await createGroupWithAcceptedInvite()

      const promise = context.resolveWhenGroupChangeInvitesAreSent(group.uuid)
      await vaults.changeVaultNameAndDescription(vaultSystemIdentifier, {
        name: 'new vault name',
        description: 'new vault description',
      })
      await promise

      const vaultInfo = vaults.getVaultInfo(vaultSystemIdentifier)
      expect(vaultInfo.vaultName).to.equal('new vault name')
      expect(vaultInfo.vaultDescription).to.equal('new vault description')

      await contactContext.sync()

      const contactVaultInfo = contactContext.vaults.getVaultInfo(vaultSystemIdentifier)
      expect(contactVaultInfo.vaultName).to.equal('new vault name')
      expect(contactVaultInfo.vaultDescription).to.equal('new vault description')

      await deinitContactContext()
    })
  })

  describe('item collaboration', () => {
    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      await Collaboration.createTrustedContactForUserOfContext(contactContext, context)
      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await groups.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)
      await addItemToVault(context, vaultSystemIdentifier, note)

      const promise = contactContext.awaitNextSyncGroupFromScratchEvent()
      contactContext.unlockSyncing()
      await contactContext.sync()
      await Collaboration.acceptAllInvites(contactContext)
      await promise

      const receivedItemsKey = contactContext.application.items.getPrimaryVaultItemsKeyForVault(vaultSystemIdentifier)
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('group creator should receive changes from other members', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, vaultSystemIdentifier, note)
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

    it.skip('removing an item from a vault should remove it from collaborator devices', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.vaults.moveItemFromVaultToUser(note)

      await context.changeNoteTitleAndSync(note, 'new title')

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.not.equal('new title')
      expect(receivedNote.title).to.equal(note.title)

      await deinitContactContext()
    })

    it('items added by collaborator should be received by group owner', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } =
        await createGroupWithAcceptedInviteAndNote()

      const newNote = await contactContext.createSyncedNote('new note', 'new note text')
      await addItemToVault(contactContext, vaultSystemIdentifier, newNote)

      await context.sync()

      const receivedNote = context.application.items.findItem(newNote.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.equal('new note')

      await deinitContactContext()
    })

    it('conflicts created should be associated with the vault', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.changeNoteTitle(note, 'new title first client')
      await contactContext.changeNoteTitle(note, 'new title second client')

      const doneAddingConflictToGroup = contactContext.resolveWhenItemCompletesAddingToGroup()

      await context.sync({ desc: 'First client sync' })
      await contactContext.sync({
        desc: 'Second client sync with conflicts to be created',
      })
      await doneAddingConflictToGroup
      await context.sync({ desc: 'First client sync with conflicts to be pulled in' })

      expect(context.items.invalidItems.length).to.equal(0)
      expect(contactContext.items.invalidItems.length).to.equal(0)

      const originatorNotes = context.items.getDisplayableNotes()
      expect(originatorNotes.length).to.equal(2)
      expect(originatorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

      const collaboratorNotes = contactContext.items.getDisplayableNotes()
      expect(collaboratorNotes.length).to.equal(2)
      expect(collaboratorNotes.find((note) => !!note.duplicate_of)).to.not.be.undefined

      await deinitContactContext()
    })

    it.skip('failing test that results in a sync fail race condition', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.changeNoteTitle(note, 'new title first client')
      await contactContext.changeNoteTitle(note, 'new title second client')

      const doneAddingConflictToGroup = contactContext.resolveWhenItemCompletesAddingToGroup()

      await context.sync({ desc: 'First client sync' })
      await contactContext.sync({
        desc: 'Second client sync with conflicts to be created',
      })

      await context.sync({ desc: 'First client sync with conflicts to be pulled in' })

      /**
       * Putting the below promise await after the first-client sync above will result
       * in first client never being able to pull in the changes made, even if subsequent syncs are done
       */
      await doneAddingConflictToGroup

      const originatorNotes = context.items.getDisplayableNotes()
      expect(originatorNotes.length).to.equal(2)

      await deinitContactContext()
    })
  })

  describe('deletion', () => {
    it('should remove item from all user devices when item is deleted permanently', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await context.items.setItemToBeDeleted(note)
      const promise = context.resolveWhenSavedSyncPayloadsIncludesItemUuid(note.uuid)
      await context.sync()
      await contactContext.sync()
      await promise

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote).to.be.undefined

      const collaboratorNote = contactContext.application.items.findItem(note.uuid)
      expect(collaboratorNote).to.be.undefined

      await deinitContactContext()
    })

    it('attempting to delete a note received by and already deleted by another person should not cause infinite conflicts', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const promise = context.resolveWhenSavedSyncPayloadsIncludesItemUuid(note.uuid)

      await context.items.setItemToBeDeleted(note)
      await contactContext.items.setItemToBeDeleted(note)

      await context.sync()
      await contactContext.sync()
      await promise

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote).to.be.undefined

      const collaboratorNote = contactContext.application.items.findItem(note.uuid)
      expect(collaboratorNote).to.be.undefined

      await deinitContactContext()
    })

    it('deleting a vault should delete its respective group', async () => {
      console.error('TODO: implement')
    })

    it('deleting a group should keep vault in tact for vault owner', async () => {
      console.error('TODO: implement')
    })

    it('deleting a group should remove all vault items from collaborator devices', async () => {
      const { group, note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      await groups.deleteGroup(group.uuid)
      await contactContext.sync()

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote).to.be.undefined

      const contactNote = contactContext.application.items.findItem(note.uuid)
      expect(contactNote).to.be.undefined

      await deinitContactContext()
    })
  })

  describe('invites', () => {
    it('should invite contact to vault', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

      const vaultInvite = await groups.inviteContactToGroup(group, contact, GroupPermission.Write)

      expect(vaultInvite).to.not.be.undefined
      expect(vaultInvite.vault_system_identifier).to.equal(vaultSystemIdentifier)
      expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
      expect(vaultInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(vaultInvite.inviter_public_key).to.equal(groups.userPublicKey)
      expect(vaultInvite.permissions).to.equal(GroupPermission.Write)
      expect(vaultInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await groups.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)

      await contactContext.groups.downloadInboundInvites()
      expect(contactContext.groups.getTrustedSenderOfInvite(contactContext.groups.getCachedInboundInvites()[0])).to.be
        .undefined

      await deinitContactContext()
    })

    it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await groups.inviteContactToGroup(group, currentContextContact, GroupPermission.Write)

      await contactContext.groups.downloadInboundInvites()
      expect(contactContext.groups.getTrustedSenderOfInvite(contactContext.groups.getCachedInboundInvites()[0])).to.be
        .undefined

      await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

      expect(contactContext.groups.getTrustedSenderOfInvite(contactContext.groups.getCachedInboundInvites()[0])).to.not
        .be.undefined

      await deinitContactContext()
    })

    it('received items should contain the uuid of the contact who sent the item', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.user_uuid).to.equal(context.userUuid)

      await deinitContactContext()
    })

    it('items should contain the uuid of the last person who edited it', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.last_edited_by_uuid).to.not.be.undefined
      expect(receivedNote.last_edited_by_uuid).to.equal(context.userUuid)

      await contactContext.changeNoteTitleAndSync(receivedNote, 'new title')
      await context.sync()

      const updatedNote = context.application.items.findItem(note.uuid)
      expect(updatedNote.last_edited_by_uuid).to.not.be.undefined
      expect(updatedNote.last_edited_by_uuid).to.equal(contactContext.userUuid)

      await deinitContactContext()
    })
  })

  describe('user credentials change', () => {
    it('should reupload all outbound invites when inviter keypair changes', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await groups.inviteContactToGroup(group, contact, GroupPermission.Write)
      await contactContext.sync()

      const vaultInvite = contactContext.groups.getCachedInboundInvites()[0]
      expect(vaultInvite.inviter_public_key).to.equal(groups.userPublicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedGroupInvite = contactContext.groups.getCachedInboundInvites()[0]
      expect(updatedGroupInvite.inviter_public_key).to.equal(groups.userPublicKey)

      await deinitContactContext()
    })
  })

  describe('vault key rotation', () => {
    it("rotating a vault's key should send a key-change invite to all members", async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaults.rotateVaultKey(vaultSystemIdentifier)

      const outboundInvites = await groups.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.vault_system_identifier).to.equal(vaultSystemIdentifier)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(groups.userPublicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a vault's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } =
        await createGroupWithUnacceptedButTrustedInvite()
      contactContext.lockSyncing()

      const originalOutboundInvites = await groups.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncVaultData = originalOutboundInvites[0].encrypted_vault_key_content

      await vaults.rotateVaultKey(vaultSystemIdentifier)

      const updatedOutboundInvites = await groups.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(1)

      const joinInvite = updatedOutboundInvites[0]
      expect(joinInvite.invite_type).to.equal('join')
      expect(joinInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(joinInvite.encrypted_vault_key_content).to.not.equal(originalEncVaultData)

      await deinitContactContext()
    })

    it('should update both pending join and key-change invites instead of creating new ones', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      const thirdParty = await Collaboration.createContactContext()
      const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
        context,
        thirdParty.contactContext,
      )
      await groups.inviteContactToGroup(group, thirdPartyContact, GroupPermission.Write)

      const originalOutboundInvites = await groups.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await vaults.rotateVaultKey(vaultSystemIdentifier)

      const updatedOutboundInvites = await groups.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(2)

      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'join')).to.not.be.undefined
      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'key-change')).to.not.be.undefined

      await deinitContactContext()
      await thirdParty.deinitContactContext()
    })

    it('key change invites should be automatically accepted by trusted contacts', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaults.rotateVaultKey(vaultSystemIdentifier)

      const acceptInviteSpy = sinon.spy(contactContext.groups, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate vault key after removing vault member', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const originalVaultKey = context.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)

      await groups.removeUserFromGroup(groupUuid, contactContext.userUuid)

      const newVaultKey = context.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)

      expect(newVaultKey.keyTimestamp).to.be.greaterThan(originalVaultKey.keyTimestamp)
      expect(newVaultKey.key).to.not.equal(originalVaultKey.key)

      await deinitContactContext()
    })
  })

  describe('permissions', async () => {
    it('should not be able to update a vault with a keyTimestamp lower than the current one', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const vaultKeyCopy = context.items.getPrimarySyncedVaultKeyCopy(vaultSystemIdentifier)

      const result = await groups.updateGroup({
        groupUuid: 'todo',
        specifiedItemsKeyUuid: '123',
      })

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('attempting to save note to non-existent vault should result in GroupNotMemberError conflict', async () => {
      const note = await context.createSyncedNote('foo', 'bar')

      const promise = context.resolveWithConflicts()
      const objectToSpy = application.sync

      sinon.stub(objectToSpy, 'payloadsByPreparingForServer').callsFake(async (params) => {
        objectToSpy.payloadsByPreparingForServer.restore()

        const payloads = await objectToSpy.payloadsByPreparingForServer(params)
        for (const payload of payloads) {
          payload.vault_system_identifier = 'non-existent-vault-uuid-123'
        }

        return payloads
      })

      await context.changeNoteTitleAndSync(note, 'new-title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.GroupNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it('attempting to save item using an old vault items key should result in GroupInvalidItemsKey conflict', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      const note = await context.createSyncedNote('foo', 'bar')
      await context.addItemToVault(context, vaultSystemIdentifier, note)

      const oldVaultItemsKey = context.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

      await context.vaults.rotateVaultKey(vaultSystemIdentifier)

      await context.groups.groupCache.updateGroups([
        {
          ...group,
          specified_items_key_uuid: oldVaultItemsKey.uuid,
        },
      ])

      const promise = context.resolveWithConflicts()
      await context.changeNoteTitleAndSync(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.GroupInvalidItemsKeyError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it("should use the cached group's specified items key when choosing which key to encrypt vault items with", async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()

      const firstVaultItemsKey = context.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

      const note = await context.createSyncedNote('foo', 'bar')
      const firstPromise = context.resolveWithUploadedPayloads()
      await context.addItemToVault(context, vaultSystemIdentifier, note)
      const firstUploadedPayloads = await firstPromise

      expect(firstUploadedPayloads[0].items_key_id).to.equal(firstVaultItemsKey.uuid)
      expect(firstUploadedPayloads[0].items_key_id).to.equal(vault.specified_items_key_uuid)

      await context.vaults.rotateVaultKey(vaultSystemIdentifier)
      const secondVaultItemsKey = context.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

      const secondPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'new title')
      const secondUploadedPayloads = await secondPromise

      expect(secondUploadedPayloads[0].items_key_id).to.equal(secondVaultItemsKey.uuid)

      await context.groups.groupCache.updateGroups([
        {
          ...group,
          specified_items_key_uuid: firstVaultItemsKey.uuid,
        },
      ])

      const thirdPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'third new title')
      const thirdUploadedPayloads = await thirdPromise

      expect(thirdUploadedPayloads[0].items_key_id).to.equal(firstVaultItemsKey.uuid)
    })

    it('non-admin user should not be able to create or update vault items keys with the server', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const vaultItemsKey = contactContext.items.getAllVaultItemsKeysForVault(vaultSystemIdentifier)[0]

      await contactContext.items.changeItem(vaultItemsKey, () => {})
      const promise = contactContext.resolveWithConflicts()
      await contactContext.sync()

      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item).to.equal(ContentType.VaultItemsKey)

      await deinitContactContext()
    })

    it("vault user should not be able to change an item using an items key that does not match the vault's specified items key", async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, vaultSystemIdentifier, note)
      await contactContext.sync()

      const newItemsKeyUuid = UuidGenerator.GenerateUuid()
      const newItemsKey = contactContext.encryption.createVaultItemsKey(newItemsKeyUuid, vaultSystemIdentifier)
      await contactContext.items.insertItem(newItemsKey)

      const contactVault = contactContext.vaults.vaultStorage.getVault(vaultSystemIdentifier)
      contactContext.vaults.vaultStorage.setVault(vaultSystemIdentifier, {
        ...contactgroup,
        specifiedItemsKeyUuid: newItemsKeyUuid,
      })

      await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
        mutator.title = 'new title'
      })

      const promise = contactContext.resolveWithConflicts()
      await contactContext.sync()
      const conflicts = await promise

      expect(conflicts.length).to.equal(2)
      expect(conflicts.find((conflict) => conflict.unsaved_item.content_type === ContentType.Note)).to.not.be.undefined
      expect(conflicts.find((conflict) => conflict.unsaved_item.content_type === ContentType.VaultItemsKey)).to.not.be
        .undefined

      await deinitContactContext()
    })

    it('read user should not be able to make changes to items', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(
        GroupPermission.Read,
      )
      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, vaultSystemIdentifier, note)
      await contactContext.sync()

      await contactContext.items.changeItem({ uuid: note.uuid }, (mutator) => {
        mutator.title = 'new title'
      })

      const promise = contactContext.resolveWithConflicts()
      await contactContext.sync()
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('should be able to move item from vault to user as a write user if the item belongs to me', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.addItemToVault(context, vaultSystemIdentifier, note)
      await contactContext.sync()

      const promise = contactContext.resolveWithConflicts()
      await contactContext.vaults.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(0)

      const duplicateNote = contactContext.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.be.undefined

      const existingNote = contactContext.items.findItem(note.uuid)
      expect(existingNote.vault_system_identifier).to.not.be.ok

      await deinitContactContext()
    })

    it('should create a non-vaulted copy if attempting to move item from vault to user and item belongs to someone else', async () => {
      const { note, group, contactContext, deinitContactContext } = await createGroupWithAcceptedInviteAndNote()

      const promise = contactContext.resolveWithConflicts()
      await contactContext.vaults.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = contactContext.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.vault_system_identifier).to.not.be.ok

      const existingNote = contactContext.items.findItem(note.uuid)
      expect(existingNote.vault_system_identifier).to.equal(vaultSystemIdentifier)

      await deinitContactContext()
    })

    it('should created a non-vaulted copy if admin attempts to move item from vault to user if the item belongs to someone else', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.addItemToVault(context, vaultSystemIdentifier, note)
      await context.sync()

      const promise = context.resolveWithConflicts()
      await context.vaults.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = context.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.vault_system_identifier).to.not.be.ok

      const existingNote = context.items.findItem(note.uuid)
      expect(existingNote.vault_system_identifier).to.equal(vaultSystemIdentifier)

      await deinitContactContext()
    })
  })

  describe('sync errors and conflicts', () => {
    it('after leaving group, attempting to sync previously vault item should result in GroupNotMemberError', async () => {
      const { vaultSystemIdentifier, note, contactContext, deinitContactContext } =
        await createGroupWithAcceptedInviteAndNote()

      await context.groups.removeUserFromGroup(groupUuid, contactContext.userUuid)

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.GroupNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('attempting to modify note as read user should result in GroupInsufficientPermissionsError', async () => {
      const { note, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(GroupPermission.Read)

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.GroupInsufficientPermissionsError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('should handle GroupNotMemberError by duplicating item to user non-vault', async () => {
      const { vaultSystemIdentifier, note, contactContext, deinitContactContext } =
        await createGroupWithAcceptedInviteAndNote()

      await context.groups.removeUserFromGroup(groupUuid, contactContext.userUuid)

      await contactContext.changeNoteTitle(note, 'new title')

      const notes = contactContext.notes

      expec(notes.length).to.equal(1)
      expect(notes[0].title).to.equal('new title')
      expect(notes[0].vault_system_identifier).to.not.be.ok
      expect(notes[0].duplicate_of).to.equal(note.uuid)

      await deinitContactContext()
    })
  })

  describe('files', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to upload and download file to vault as owner', async () => {
      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vaultSystemIdentifier)

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)
      expect(file.vault_system_identifier).to.equal(vaultSystemIdentifier)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a user file to a vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)

      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const addedFile = await vaults.addItemToVault(vaultSystemIdentifier, uploadedFile)

      const downloadedBytes = await Files.downloadFile(context.files, addedFile)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a file out of its vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const { vaultSystemIdentifier, group } = await createVaultAndGroup()
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vaultSystemIdentifier)

      const removedFile = await vaults.moveItemFromVaultToUser(uploadedFile)
      expect(removedFile.vault_system_identifier).to.not.be.ok

      const downloadedBytes = await Files.downloadFile(context.files, removedFile)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to download vault file as collaborator', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vaultSystemIdentifier)

      await contactContext.sync()

      const sharedFile = contactContext.items.findItem(uploadedFile.uuid)
      expect(sharedFile).to.not.be.undefined
      expect(sharedFile.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should be able to upload vault file as collaborator', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(
        contactContext.files,
        buffer,
        'my-file',
        'md',
        1000,
        vaultSystemIdentifier,
      )

      await context.sync()

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should be able to delete vault file as write user', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(
        GroupPermission.Write,
      )
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vaultSystemIdentifier)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(result).to.be.undefined

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.be.undefined

      await deinitContactContext()
    })

    it('should not be able to delete vault file as read user', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite(
        GroupPermission.Read,
      )
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vaultSystemIdentifier)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(isClientDisplayableError(result)).to.be.true

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.not.be.undefined

      await deinitContactContext()
    })

    it('should be able to download recently moved vault file as collaborator', async () => {
      const { vaultSystemIdentifier, contactContext, deinitContactContext } = await createGroupWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)
      const addedFile = await vaults.addItemToVault(vaultSystemIdentifier, uploadedFile)

      await contactContext.sync()

      const sharedFile = contactContext.items.findItem(addedFile.uuid)
      expect(sharedFile).to.not.be.undefined
      expect(sharedFile.remoteIdentifier).to.equal(addedFile.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should not be able to download file after being removed from vault', async () => {
      console.error('TODO: implement test case')
    })
  })
})
