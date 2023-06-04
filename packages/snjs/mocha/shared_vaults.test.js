import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'
import * as Collaboration from './lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaults
  let sharedVaults

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
    sharedVaults = context.sharedVaults
  })

  const createSharedVaultWithAcceptedInvite = async (permissions = SharedVaultPermission.Write) => {
    const { sharedVault, contact, contactContext, deinitContactContext } =
      await createSharedVaultWithUnacceptedButTrustedInvite(permissions)

    await Collaboration.acceptAllInvites(contactContext)

    await contactContext.awaitNextSyncSharedVaultFromScratchEvent()

    return { sharedVault, contact, contactContext, deinitContactContext }
  }

  const createSharedVaultWithAcceptedInviteAndNote = async (permissions = SharedVaultPermission.Write) => {
    const { sharedVault, contactContext, contact, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
      permissions,
    )
    const note = await context.createSyncedNote('foo', 'bar')
    await addItemToVault(context, sharedVault, note)
    await contactContext.sync()
    return { sharedVault, note, contact, contactContext, deinitContactContext }
  }

  const createSharedVaultWithUnacceptedButTrustedInvite = async (permissions = SharedVaultPermission.Write) => {
    const keySystemIdentifier = await vaults.createVault()
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    const sharedVault = await sharedVaults.createSharedVault({ keySystemIdentifier })

    const invite = await sharedVaults.inviteContactToSharedVault(sharedVault, contact, permissions)
    await contactContext.sync()

    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

    return { sharedVault, contact, contactContext, deinitContactContext, invite }
  }

  const createSharedVault = async () => {
    const sharedVault = await sharedVaults.createSharedVault('My Shared Vault')
    return sharedVault
  }

  const addItemToVault = async (contextToAddTo, sharedVault, item) => {
    const promise = contextToAddTo.resolveWhenItemCompletesAddingToVault(item)
    await contextToAddTo.sharedVaults.addItemToVault(sharedVault, item)
    await promise
  }

  it('should add item to shared vault with no other members', async () => {
    const note = await context.createSyncedNote('foo', 'bar')

    const sharedVault = await createSharedVault()

    await addItemToVault(context, sharedVault, note)

    const updatedNote = application.items.findItem(note.uuid)
    expect(updatedNote.key_system_identifier).to.equal(keySystemIdentifier)
    expect(updatedNote.shared_vault_uuid).to.equal(sharedVault.uuid)
  })

  it('should add item to shared vault with contact', async () => {
    const note = await context.createSyncedNote('foo', 'bar')
    const { sharedVault, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

    await addItemToVault(context, sharedVault, note)

    const updatedNote = application.items.findItem(note.uuid)
    expect(updatedNote.key_system_identifier).to.equal(sharedVault.key_system_identifier)

    await deinitContactContext()
  })

  it('should sync a sharedVault from scratch after accepting an invitation', async () => {
    const sharedVault = await createSharedVault()

    const note = await context.createSyncedNote('foo', 'bar')
    await addItemToVault(context, sharedVault, note)

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

    const receivedNote = contactContext.application.items.findItem(note.uuid)
    expect(receivedNote).to.not.be.undefined
    expect(receivedNote.title).to.equal('foo')
    expect(receivedNote.text).to.equal(note.text)

    await deinitContactContext()
  })

  it('should remove sharedVault member', async () => {
    const { sharedVault, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

    const originalSharedVaultUsers = await sharedVaults.getSharedVaultUsers(sharedVault.uuid)
    expect(originalSharedVaultUsers.length).to.equal(2)

    const result = await sharedVaults.removeUserFromSharedVault(sharedVault.uuid, contactContext.userUuid)

    expect(isClientDisplayableError(result)).to.be.false

    const updatedSharedVaultUsers = await sharedVaults.getSharedVaultUsers(sharedVault.uuid)
    expect(updatedSharedVaultUsers.length).to.equal(1)

    await deinitContactContext()
  })

  it('non-admin user should not be able to invite user', async () => {
    const { sharedVault, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

    const thirdParty = await Collaboration.createContactContext()
    const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
      contactContext,
      thirdParty.contactContext,
    )
    const result = await contactContext.sharedVaults.inviteContactToSharedVault(
      sharedVault,
      thirdPartyContact,
      SharedVaultPermission.Write,
    )

    expect(isClientDisplayableError(result)).to.be.true

    await deinitContactContext()
  })

  it('should not be able to leave sharedVault as creator', async () => {
    const { sharedVault } = await createSharedVault()

    const result = await sharedVaults.removeUserFromSharedVault(sharedVault.uuid, context.userUuid)

    expect(isClientDisplayableError(result)).to.be.true
  })

  it('should be able to leave sharedVault as added admin', async () => {
    const { sharedVault, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
      SharedVaultPermission.Admin,
    )

    const result = await contactContext.sharedVaults.leaveSharedVault(sharedVault.uuid)

    expect(isClientDisplayableError(result)).to.be.false

    await deinitContactContext()
  })

  it('leaving a sharedVault should remove its items locally', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await createSharedVaultWithAcceptedInviteAndNote(SharedVaultPermission.Admin)

    const originalNote = contactContext.application.items.findItem(note.uuid)
    expect(originalNote).to.not.be.undefined

    await contactContext.sharedVaults.leaveSharedVault(sharedVault.uuid)

    const updatedContactNote = contactContext.application.items.findItem(note.uuid)
    expect(updatedContactNote).to.be.undefined

    await deinitContactContext()
  })

  it('leaving or being removed from sharedVault should remove sharedVault items locally', async () => {
    const { sharedVault, note, contactContext, deinitContactContext } =
      await createSharedVaultWithAcceptedInviteAndNote()

    const contactNote = contactContext.application.items.findItem(note.uuid)
    expect(contactNote).to.not.be.undefined

    await context.sharedVaults.removeUserFromSharedVault(sharedVault.uuid, contactContext.userUuid)

    await contactContext.sync()
    await contactContext.sharedVaults.reloadRemovedSharedVaults()

    const updatedContactNote = contactContext.application.items.findItem(note.uuid)
    expect(updatedContactNote).to.be.undefined

    await deinitContactContext()
  })

  it('canceling an invite should remove it from recipient pending invites', async () => {
    const { invite, contactContext, deinitContactContext } = await createSharedVaultWithUnacceptedButTrustedInvite()

    const preInvites = await contactContext.sharedVaults.downloadInboundInvites()
    expect(preInvites.length).to.equal(1)

    await sharedVaults.deleteInvite(invite)

    const postInvites = await contactContext.sharedVaults.downloadInboundInvites()
    expect(postInvites.length).to.equal(0)

    await deinitContactContext()
  })

  it('should update vault name and description', async () => {
    const { sharedVault, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

    const promise = context.resolveWhenSharedVaultChangeInvitesAreSent(sharedVault.uuid)
    await vaults.changeVaultNameAndDescription(sharedVault.key_system_identifier, {
      name: 'new vault name',
      description: 'new vault description',
    })
    await promise

    const vaultInfo = vaults.getVaultInfo(sharedVault.key_system_identifier)
    expect(vaultInfo.vaultName).to.equal('new vault name')
    expect(vaultInfo.vaultDescription).to.equal('new vault description')

    await contactContext.sync()

    const contactVaultInfo = contactContext.vaults.getVaultInfo(sharedVault.key_system_identifier)
    expect(contactVaultInfo.vaultName).to.equal('new vault name')
    expect(contactVaultInfo.vaultDescription).to.equal('new vault description')

    await deinitContactContext()
  })

  describe('item collaboration', () => {
    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const sharedVault = await createSharedVault()

      await Collaboration.createTrustedContactForUserOfContext(contactContext, context)
      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await sharedVaults.inviteContactToSharedVault(sharedVault, currentContextContact, SharedVaultPermission.Write)
      await addItemToVault(context, sharedVault, note)

      const promise = contactContext.awaitNextSyncSharedVaultFromScratchEvent()
      contactContext.unlockSyncing()
      await contactContext.sync()
      await Collaboration.acceptAllInvites(contactContext)
      await promise

      const receivedItemsKey = contactContext.application.items.getPrimaryKeySystemItemsKey(keySystemIdentifier)
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('sharedVault creator should receive changes from other members', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, sharedVault, note)
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
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

      await context.vaults.removeItemFromVault(note)

      await context.changeNoteTitleAndSync(note, 'new title')

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.not.equal('new title')
      expect(receivedNote.title).to.equal(note.title)

      await deinitContactContext()
    })

    it('items added by collaborator should be received by sharedVault owner', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } =
        await createSharedVaultWithAcceptedInviteAndNote()

      const newNote = await contactContext.createSyncedNote('new note', 'new note text')
      await addItemToVault(contactContext, keySystemIdentifier, newNote)

      await context.sync()

      const receivedNote = context.application.items.findItem(newNote.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.equal('new note')

      await deinitContactContext()
    })

    it('conflicts created should be associated with the vault', async () => {
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

      await context.changeNoteTitle(note, 'new title first client')
      await contactContext.changeNoteTitle(note, 'new title second client')

      const doneAddingConflictToSharedVault = contactContext.resolveWhenItemCompletesAddingToVault()

      await context.sync({ desc: 'First client sync' })
      await contactContext.sync({
        desc: 'Second client sync with conflicts to be created',
      })
      await doneAddingConflictToSharedVault
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
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

      await context.changeNoteTitle(note, 'new title first client')
      await contactContext.changeNoteTitle(note, 'new title second client')

      const doneAddingConflictToSharedVault = contactContext.resolveWhenItemCompletesAddingToVault()

      await context.sync({ desc: 'First client sync' })
      await contactContext.sync({
        desc: 'Second client sync with conflicts to be created',
      })

      await context.sync({ desc: 'First client sync with conflicts to be pulled in' })

      /**
       * Putting the below promise await after the first-client sync above will result
       * in first client never being able to pull in the changes made, even if subsequent syncs are done
       */
      await doneAddingConflictToSharedVault

      const originatorNotes = context.items.getDisplayableNotes()
      expect(originatorNotes.length).to.equal(2)

      await deinitContactContext()
    })
  })

  describe('deletion', () => {
    it('should remove item from all user devices when item is deleted permanently', async () => {
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

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
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

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

    it('deleting a vault should delete its respective sharedVault', async () => {
      console.error('TODO: implement')
    })

    it('deleting a sharedVault should keep vault in tact for vault owner', async () => {
      console.error('TODO: implement')
    })

    it('deleting a sharedVault should remove all vault items from collaborator devices', async () => {
      const { sharedVault, note, contactContext, deinitContactContext } =
        await createSharedVaultWithAcceptedInviteAndNote()

      await sharedVaults.deleteSharedVault(sharedVault.uuid)
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
      const sharedVault = await createSharedVault()
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)

      const vaultInvite = await sharedVaults.inviteContactToSharedVault(
        sharedVault,
        contact,
        SharedVaultPermission.Write,
      )

      expect(vaultInvite).to.not.be.undefined
      expect(vaultInvite.key_system_identifier).to.equal(keySystemIdentifier)
      expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
      expect(vaultInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(vaultInvite.inviter_public_key).to.equal(sharedVaults.userPublicKey)
      expect(vaultInvite.permissions).to.equal(SharedVaultPermission.Write)
      expect(vaultInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const sharedVault = await createSharedVault()

      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await sharedVaults.inviteContactToSharedVault(sharedVault, currentContextContact, SharedVaultPermission.Write)

      await contactContext.sharedVaults.downloadInboundInvites()
      expect(
        contactContext.sharedVaults.getTrustedSenderOfInvite(contactContext.sharedVaults.getCachedInboundInvites()[0]),
      ).to.be.undefined

      await deinitContactContext()
    })

    it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const sharedVault = await createSharedVault()

      const currentContextContact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await sharedVaults.inviteContactToSharedVault(sharedVault, currentContextContact, SharedVaultPermission.Write)

      await contactContext.sharedVaults.downloadInboundInvites()
      expect(
        contactContext.sharedVaults.getTrustedSenderOfInvite(contactContext.sharedVaults.getCachedInboundInvites()[0]),
      ).to.be.undefined

      await Collaboration.createTrustedContactForUserOfContext(contactContext, context)

      expect(
        contactContext.sharedVaults.getTrustedSenderOfInvite(contactContext.sharedVaults.getCachedInboundInvites()[0]),
      ).to.not.be.undefined

      await deinitContactContext()
    })

    it('received items should contain the uuid of the contact who sent the item', async () => {
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.user_uuid).to.equal(context.userUuid)

      await deinitContactContext()
    })

    it('items should contain the uuid of the last person who edited it', async () => {
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInviteAndNote()

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
      const sharedVault = await createSharedVault()
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await sharedVaults.inviteContactToSharedVault(sharedVault, contact, SharedVaultPermission.Write)
      await contactContext.sync()

      const vaultInvite = contactContext.sharedVaults.getCachedInboundInvites()[0]
      expect(vaultInvite.inviter_public_key).to.equal(sharedVaults.userPublicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedSharedVaultInvite = contactContext.sharedVaults.getCachedInboundInvites()[0]
      expect(updatedSharedVaultInvite.inviter_public_key).to.equal(sharedVaults.userPublicKey)

      await deinitContactContext()
    })
  })

  describe('key system root key rotation', () => {
    it("rotating a vault's key should send a key-change invite to all members", async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaults.rotateKeySystemRootKey(keySystemIdentifier)

      const outboundInvites = await sharedVaults.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.key_system_identifier).to.equal(keySystemIdentifier)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(sharedVaults.userPublicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a vault's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } =
        await createSharedVaultWithUnacceptedButTrustedInvite()
      contactContext.lockSyncing()

      const originalOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncVaultData = originalOutboundInvites[0].encrypted_vault_key_content

      await vaults.rotateKeySystemRootKey(keySystemIdentifier)

      const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(1)

      const joinInvite = updatedOutboundInvites[0]
      expect(joinInvite.invite_type).to.equal('join')
      expect(joinInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(joinInvite.encrypted_vault_key_content).to.not.equal(originalEncVaultData)

      await deinitContactContext()
    })

    it('should update both pending join and key-change invites instead of creating new ones', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      const thirdParty = await Collaboration.createContactContext()
      const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
        context,
        thirdParty.contactContext,
      )
      await sharedVaults.inviteContactToSharedVault(sharedVault, thirdPartyContact, SharedVaultPermission.Write)

      const originalOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await vaults.rotateKeySystemRootKey(keySystemIdentifier)

      const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(2)

      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'join')).to.not.be.undefined
      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'key-change')).to.not.be.undefined

      await deinitContactContext()
      await thirdParty.deinitContactContext()
    })

    it('key change invites should be automatically accepted by trusted contacts', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaults.rotateKeySystemRootKey(keySystemIdentifier)

      const acceptInviteSpy = sinon.spy(contactContext.sharedVaults, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate key system root key after removing vault member', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

      const originalKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(keySystemIdentifier)

      await sharedVaults.removeUserFromSharedVault(sharedVaultUuid, contactContext.userUuid)

      const newKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(keySystemIdentifier)

      expect(newKeySystemRootKey.keyTimestamp).to.be.greaterThan(originalKeySystemRootKey.keyTimestamp)
      expect(newKeySystemRootKey.key).to.not.equal(originalKeySystemRootKey.key)

      await deinitContactContext()
    })
  })

  describe('permissions', async () => {
    it('should not be able to update a vault with a keyTimestamp lower than the current one', async () => {
      const sharedVault = await createSharedVault()
      const keySystemRootKey = context.items.getPrimaryKeySystemRootKey(keySystemIdentifier)

      const result = await sharedVaults.updateSharedVault({
        sharedVaultUuid: 'todo',
        specifiedItemsKeyUuid: '123',
      })

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('attempting to save note to non-existent vault should result in SharedVaultNotMemberError conflict', async () => {
      const note = await context.createSyncedNote('foo', 'bar')

      const promise = context.resolveWithConflicts()
      const objectToSpy = application.sync

      sinon.stub(objectToSpy, 'payloadsByPreparingForServer').callsFake(async (params) => {
        objectToSpy.payloadsByPreparingForServer.restore()

        const payloads = await objectToSpy.payloadsByPreparingForServer(params)
        for (const payload of payloads) {
          payload.key_system_identifier = 'non-existent-vault-uuid-123'
        }

        return payloads
      })

      await context.changeNoteTitleAndSync(note, 'new-title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it('attempting to save item using an old vault items key should result in SharedVaultInvalidItemsKey conflict', async () => {
      const sharedVault = await createSharedVault()

      const note = await context.createSyncedNote('foo', 'bar')
      await context.addItemToVault(context, keySystemIdentifier, note)

      const oldKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

      await context.vaults.rotateKeySystemRootKey(keySystemIdentifier)

      await context.sharedVaults.sharedVaultCache.updateSharedVaults([
        {
          ...sharedVault,
          specified_items_key_uuid: oldKeySystemItemsKey.uuid,
        },
      ])

      const promise = context.resolveWithConflicts()
      await context.changeNoteTitleAndSync(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.SharedVaultInvalidItemsKeyError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)
    })

    it("should use the cached sharedVault's specified items key when choosing which key to encrypt vault items with", async () => {
      const sharedVault = await createSharedVault()

      const firstKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

      const note = await context.createSyncedNote('foo', 'bar')
      const firstPromise = context.resolveWithUploadedPayloads()
      await context.addItemToVault(context, keySystemIdentifier, note)
      const firstUploadedPayloads = await firstPromise

      expect(firstUploadedPayloads[0].items_key_id).to.equal(firstKeySystemItemsKey.uuid)
      expect(firstUploadedPayloads[0].items_key_id).to.equal(vault.specified_items_key_uuid)

      await context.vaults.rotateKeySystemRootKey(keySystemIdentifier)
      const secondKeySystemItemsKey = context.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

      const secondPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'new title')
      const secondUploadedPayloads = await secondPromise

      expect(secondUploadedPayloads[0].items_key_id).to.equal(secondKeySystemItemsKey.uuid)

      await context.sharedVaults.sharedVaultCache.updateSharedVaults([
        {
          ...sharedVault,
          specified_items_key_uuid: firstKeySystemItemsKey.uuid,
        },
      ])

      const thirdPromise = context.resolveWithUploadedPayloads()
      await context.changeNoteTitleAndSync(note, 'third new title')
      const thirdUploadedPayloads = await thirdPromise

      expect(thirdUploadedPayloads[0].items_key_id).to.equal(firstKeySystemItemsKey.uuid)
    })

    it('non-admin user should not be able to create or update vault items keys with the server', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

      const keySystemItemsKey = contactContext.items.getKeySystemItemsKeys(keySystemIdentifier)[0]

      await contactContext.items.changeItem(keySystemItemsKey, () => {})
      const promise = contactContext.resolveWithConflicts()
      await contactContext.sync()

      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item).to.equal(ContentType.KeySystemItemsKey)

      await deinitContactContext()
    })

    it("vault user should not be able to change an item using an items key that does not match the vault's specified items key", async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, sharedVault, note)
      await contactContext.sync()

      const newItemsKeyUuid = UuidGenerator.GenerateUuid()
      const newItemsKey = contactContext.encryption.createKeySystemItemsKey(newItemsKeyUuid, keySystemIdentifier)
      await contactContext.items.insertItem(newItemsKey)

      const contactVault = contactContext.vaults.vaultStorage.getVault(keySystemIdentifier)
      contactContext.vaults.vaultStorage.setVault(keySystemIdentifier, {
        ...contactsharedVault,
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
      expect(conflicts.find((conflict) => conflict.unsaved_item.content_type === ContentType.KeySystemItemsKey)).to.not
        .be.undefined

      await deinitContactContext()
    })

    it('read user should not be able to make changes to items', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
        SharedVaultPermission.Read,
      )
      const note = await context.createSyncedNote('foo', 'bar')
      await addItemToVault(context, sharedVault, note)
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
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.addItemToVault(context, keySystemIdentifier, note)
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

    it('should create a non-vaulted copy if attempting to move item from vault to user and item belongs to someone else', async () => {
      const { note, sharedVault, contactContext, deinitContactContext } =
        await createSharedVaultWithAcceptedInviteAndNote()

      const promise = contactContext.resolveWithConflicts()
      await contactContext.vaults.removeItemFromVault(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = contactContext.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.key_system_identifier).to.not.be.ok

      const existingNote = contactContext.items.findItem(note.uuid)
      expect(existingNote.key_system_identifier).to.equal(keySystemIdentifier)

      await deinitContactContext()
    })

    it('should created a non-vaulted copy if admin attempts to move item from vault to user if the item belongs to someone else', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.addItemToVault(context, keySystemIdentifier, note)
      await context.sync()

      const promise = context.resolveWithConflicts()
      await context.vaults.removeItemFromVault(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = context.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.key_system_identifier).to.not.be.ok

      const existingNote = context.items.findItem(note.uuid)
      expect(existingNote.key_system_identifier).to.equal(keySystemIdentifier)

      await deinitContactContext()
    })
  })

  describe('sync errors and conflicts', () => {
    it('after leaving sharedVault, attempting to sync previously vault item should result in SharedVaultNotMemberError', async () => {
      const { keySystemIdentifier, note, contactContext, deinitContactContext } =
        await createSharedVaultWithAcceptedInviteAndNote()

      await context.sharedVaults.removeUserFromSharedVault(sharedVaultUuid, contactContext.userUuid)

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.SharedVaultNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('attempting to modify note as read user should result in SharedVaultInsufficientPermissionsError', async () => {
      const { note, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
        SharedVaultPermission.Read,
      )

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.SharedVaultInsufficientPermissionsError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('should handle SharedVaultNotMemberError by duplicating item to user non-vault', async () => {
      const { keySystemIdentifier, note, contactContext, deinitContactContext } =
        await createSharedVaultWithAcceptedInviteAndNote()

      await context.sharedVaults.removeUserFromSharedVault(sharedVaultUuid, contactContext.userUuid)

      await contactContext.changeNoteTitle(note, 'new title')

      const notes = contactContext.notes

      expec(notes.length).to.equal(1)
      expect(notes[0].title).to.equal('new title')
      expect(notes[0].key_system_identifier).to.not.be.ok
      expect(notes[0].duplicate_of).to.equal(note.uuid)

      await deinitContactContext()
    })
  })

  describe('files', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to upload and download file to vault as owner', async () => {
      const sharedVault = await createSharedVault()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, keySystemIdentifier)

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)
      expect(file.key_system_identifier).to.equal(keySystemIdentifier)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a user file to a vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)

      const sharedVault = await createSharedVault()
      const addedFile = await vaults.addItemToVault(keySystemIdentifier, uploadedFile)

      const downloadedBytes = await Files.downloadFile(context.files, addedFile)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to move a file out of its vault', async () => {
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const sharedVault = await createSharedVault()
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, keySystemIdentifier)

      const removedFile = await vaults.removeItemFromVault(uploadedFile)
      expect(removedFile.key_system_identifier).to.not.be.ok

      const downloadedBytes = await Files.downloadFile(context.files, removedFile)
      expect(downloadedBytes).to.eql(buffer)
    })

    it('should be able to download vault file as collaborator', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, keySystemIdentifier)

      await contactContext.sync()

      const sharedFile = contactContext.items.findItem(uploadedFile.uuid)
      expect(sharedFile).to.not.be.undefined
      expect(sharedFile.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should be able to upload vault file as collaborator', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(
        contactContext.files,
        buffer,
        'my-file',
        'md',
        1000,
        keySystemIdentifier,
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
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
        SharedVaultPermission.Write,
      )
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, keySystemIdentifier)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(result).to.be.undefined

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.be.undefined

      await deinitContactContext()
    })

    it('should not be able to delete vault file as read user', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite(
        SharedVaultPermission.Read,
      )
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, keySystemIdentifier)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(isClientDisplayableError(result)).to.be.true

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.not.be.undefined

      await deinitContactContext()
    })

    it('should be able to download recently moved vault file as collaborator', async () => {
      const { keySystemIdentifier, contactContext, deinitContactContext } = await createSharedVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)
      const addedFile = await vaults.addItemToVault(keySystemIdentifier, uploadedFile)

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
