import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault collaboration', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaultService
  let contactService
  let collaboration

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
      publicKey: contextImportingContactInfoFrom.collaboration.userPublicKey,
      contactUuid: contextImportingContactInfoFrom.userUuid,
    })

    return contact
  }

  const acceptAllInvites = async (inContext) => {
    const invites = inContext.collaboration.getCachedInboundInvites()
    for (const invite of invites) {
      const result = await inContext.collaboration.acceptInvite(invite)
      expect(result).to.be.true
    }
  }

  const createVaultWithAcceptedInvite = async (permissions = VaultPermission.Write) => {
    const { vault, contact, contactContext, deinitContactContext } = await createVaultWithUnacceptedButTrustedInvite(
      permissions,
    )
    await acceptAllInvites(contactContext)

    await contactContext.awaitNextSyncVaultFromScratchEvent()

    return { vault, contact, contactContext, deinitContactContext }
  }

  const createVaultWithAcceptedInviteAndNote = async (permissions = VaultPermission.Write) => {
    const { vault, contactContext, contact, deinitContactContext } = await createVaultWithAcceptedInvite(permissions)
    const note = await context.createSyncedNote('foo', 'bar')
    await vaultService.addItemToVault(vault, note)
    await contactContext.sync()
    return { vault, note, contact, contactContext, deinitContactContext }
  }

  const createVaultWithUnacceptedButTrustedInvite = async (permissions = VaultPermission.Write) => {
    const vault = await vaultService.createVault()
    const { contactContext, deinitContactContext } = await createContactContext()
    const contact = await createTrustedContactForUserOfContext(context, contactContext)
    const invite = await collaboration.inviteContactToVault(vault, contact, permissions)
    await contactContext.sync()

    await createTrustedContactForUserOfContext(contactContext, context)

    return { vault, contact, contactContext, deinitContactContext, invite }
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
    vaultService = application.vaultService
    contactService = application.contactService
    collaboration = vaultService.collaboration
  })

  describe('authentication', () => {
    it('should create keypair during registration', () => {
      expect(vaultService.userPublicKey).to.not.be.undefined
      expect(vaultService.userDecryptedPrivateKey).to.not.be.undefined
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

      expect(recreatedContext.vaultService.userPublicKey).to.not.be.undefined
      expect(recreatedContext.vaultService.userDecryptedPrivateKey).to.not.be.undefined
    })

    it('should rotate keypair during password change', async () => {
      const oldPublicKey = vaultService.userPublicKey
      const oldPrivateKey = vaultService.userDecryptedPrivateKey

      await context.changePassword('new_password')

      expect(vaultService.userPublicKey).to.not.be.undefined
      expect(vaultService.userDecryptedPrivateKey).to.not.be.undefined
      expect(vaultService.userPublicKey).to.not.equal(oldPublicKey)
      expect(vaultService.userDecryptedPrivateKey).to.not.equal(oldPrivateKey)
    })

    it('should reupload encrypted private key when changing my password', async () => {
      const oldEncryptedPrivateKey = vaultService.userEncryptedPrivateKey

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
      const { contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
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

    it('should delete contact', async () => {
      console.error('TODO: implement test case')
    })
  })

  describe('vaults', () => {
    it('should add item to vault with contact', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { vault, deinitContactContext } = await createVaultWithAcceptedInvite()

      await vaultService.addItemToVault(vault, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_uuid).to.equal(vault.uuid)

      await deinitContactContext()
    })

    it('should sync a vault from scratch after accepting a vault invitation', async () => {
      const vault = await vaultService.createVault()

      /** Create an item and add it to the vault */
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)

      /** Invite a contact */
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)
      await createTrustedContactForUserOfContext(contactContext, context)

      /** Sync the contact context so that they wouldn't naturally receive changes made before this point */
      await contactContext.sync()

      await collaboration.inviteContactToVault(vault, contact, VaultPermission.Write)

      /** Contact should now sync and expect to find note */
      const promise = contactContext.awaitNextSyncVaultFromScratchEvent()
      await contactContext.sync()
      await acceptAllInvites(contactContext)
      await promise

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('should remove vault member', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const originalVaultUsers = await collaboration.getVaultUsers(vault.uuid)
      expect(originalVaultUsers.length).to.equal(2)

      const result = await collaboration.removeUserFromVault(vault.uuid, contactContext.userUuid)

      expect(isClientDisplayableError(result)).to.be.false

      const updatedVaultUsers = await collaboration.getVaultUsers(vault.uuid)
      expect(updatedVaultUsers.length).to.equal(1)

      await deinitContactContext()
    })

    it('non-admin user should not be able to invite user', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      const thirdParty = await createContactContext()
      const thirdPartyContact = await createTrustedContactForUserOfContext(contactContext, thirdParty.contactContext)
      const result = await contactContext.collaboration.inviteContactToVault(
        vault,
        thirdPartyContact,
        VaultPermission.Write,
      )

      expect(isClientDisplayableError(result)).to.be.true

      await deinitContactContext()
    })

    it('should not be able to leave vault as creator', async () => {
      const vault = await vaultService.createVault()

      const result = await collaboration.removeUserFromVault(vault.uuid, context.userUuid)

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('should be able to leave vault as added admin', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite(VaultPermission.Admin)

      const result = await contactContext.collaboration.leaveVault(vault.uuid)

      expect(isClientDisplayableError(result)).to.be.false

      await deinitContactContext()
    })

    it('leaving a vault should remove its items locally', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote(
        VaultPermission.Admin,
      )

      await contactContext.collaboration.leaveVault(vault.uuid)

      const updatedContactNote = contactContext.application.items.findItem(note.uuid)
      expect(updatedContactNote).to.be.undefined

      await deinitContactContext()
    })

    it('leaving or being removed from vault should remove vault items locally', async () => {
      const { vault, note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      const contactNote = contactContext.application.items.findItem(note.uuid)
      expect(contactNote).to.not.be.undefined

      await context.collaboration.removeUserFromVault(vault.uuid, contactContext.userUuid)

      await contactContext.sync()
      await contactContext.collaboration.reloadRemovedVaults()

      const updatedContactNote = contactContext.application.items.findItem(note.uuid)
      expect(updatedContactNote).to.be.undefined

      await deinitContactContext()
    })

    it('should return invited to vaults when fetching vaults from server', async () => {
      const { contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const vaults = await contactContext.vaultService.reloadVaults()

      expect(vaults.length).to.equal(1)

      await deinitContactContext()
    })

    it('canceling an invite should remove it from recipient pending invites', async () => {
      const { invite, contactContext, deinitContactContext } = await createVaultWithUnacceptedButTrustedInvite()

      const preInvites = await contactContext.collaboration.downloadInboundInvites()
      expect(preInvites.length).to.equal(1)

      await collaboration.deleteInvite(invite)

      const postInvites = await contactContext.collaboration.downloadInboundInvites()
      expect(postInvites.length).to.equal(0)

      await deinitContactContext()
    })

    it('should update vault name and description', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      await vaultService.changeVaultNameAndDescription(vault.uuid, {
        name: 'new vault name',
        description: 'new vault description',
      })

      const vaultInfo = vaultService.getVaultInfo(vault.uuid)
      expect(vaultInfo.vaultName).to.equal('new vault name')
      expect(vaultInfo.vaultDescription).to.equal('new vault description')

      await contactContext.sync()

      const contactVaultInfo = contactContext.vaultService.getVaultInfo(vault.uuid)
      expect(contactVaultInfo.vaultName).to.equal('new vault name')
      expect(contactVaultInfo.vaultDescription).to.equal('new vault description')

      await deinitContactContext()
    })
  })

  describe('item collaboration', () => {
    it('received items from previously trusted contact should be decrypted', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const vault = await vaultService.createVault()

      await createTrustedContactForUserOfContext(contactContext, context)
      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await collaboration.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)
      await vaultService.addItemToVault(vault, note)

      const promise = contactContext.awaitNextSyncVaultFromScratchEvent()
      contactContext.unlockSyncing()
      await contactContext.sync()
      await acceptAllInvites(contactContext)
      await promise

      const receivedItemsKey = contactContext.application.items.getVaultItemsKeysForVault(vault.uuid)[0]
      expect(receivedItemsKey).to.not.be.undefined
      expect(receivedItemsKey.itemsKey).to.not.be.undefined

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote.title).to.equal('foo')
      expect(receivedNote.text).to.equal(note.text)

      await deinitContactContext()
    })

    it('vault creator should receive changes from other members', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
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

    it('should remove an item from a vault; collaborator should no longer receive changes', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      await context.vaultService.moveItemFromVaultToUser(note)

      await context.changeNoteTitleAndSync(note, 'new title')

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.not.equal('new title')
      expect(receivedNote.title).to.equal(note.title)

      await deinitContactContext()
    })

    it('conflicts created should be associated with the vault', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

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

  describe('deletion', () => {
    it('should remove item from vault when item is deleted permanently', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

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
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

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

    it('should delete a vault and remove item associations', async () => {
      const { vault, note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      await vaultService.deleteVault(vault.uuid)

      const originatorNote = context.application.items.findItem(note.uuid)
      expect(originatorNote.vault_uuid).to.not.be.ok

      /** Contact should not be able to receive new changes, and thus will have the last copy of the note with its vault_uuid intact */
      const contactNote = contactContext.application.items.findItem(note.uuid)
      expect(contactNote.vault_uuid).to.not.be.undefined

      await deinitContactContext()
    })

    it('deleting a vault should delete all its items', async () => {
      const { vault, note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      await vaultService.deleteVault(vault.uuid)
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
      const vault = await vaultService.createVault()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)

      const vaultInvite = await collaboration.inviteContactToVault(vault, contact, VaultPermission.Write)

      expect(vaultInvite).to.not.be.undefined
      expect(vaultInvite.vault_uuid).to.equal(vault.uuid)
      expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
      expect(vaultInvite.encrypted_vault_data).to.not.be.undefined
      expect(vaultInvite.inviter_public_key).to.equal(collaboration.userPublicKey)
      expect(vaultInvite.permissions).to.equal(VaultPermission.Write)
      expect(vaultInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const vault = await vaultService.createVault()

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
      await collaboration.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)

      await contactContext.collaboration.downloadInboundInvites()
      expect(
        contactContext.collaboration.getTrustedSenderOfInvite(
          contactContext.collaboration.getCachedInboundInvites()[0],
        ),
      ).to.be.undefined

      await deinitContactContext()
    })

    it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const vault = await vaultService.createVault()

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
      await collaboration.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)

      await contactContext.collaboration.downloadInboundInvites()
      expect(
        contactContext.collaboration.getTrustedSenderOfInvite(
          contactContext.collaboration.getCachedInboundInvites()[0],
        ),
      ).to.be.undefined

      await createTrustedContactForUserOfContext(contactContext, context)

      expect(
        contactContext.collaboration.getTrustedSenderOfInvite(
          contactContext.collaboration.getCachedInboundInvites()[0],
        ),
      ).to.not.be.undefined

      await deinitContactContext()
    })

    it('received items should contain the uuid of the contact who sent the item', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      const receivedNote = contactContext.application.items.findItem(note.uuid)
      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.created_by_uuid).to.equal(context.userUuid)

      await deinitContactContext()
    })

    it('items should contain the uuid of the last person who edited it', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

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
      const vault = await vaultService.createVault()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)
      await collaboration.inviteContactToVault(vault, contact, VaultPermission.Write)
      await contactContext.sync()

      const vaultInvite = contactContext.collaboration.getCachedInboundInvites()[0]
      expect(vaultInvite.inviter_public_key).to.equal(collaboration.userPublicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedVaultInvite = contactContext.collaboration.getCachedInboundInvites()[0]
      expect(updatedVaultInvite.inviter_public_key).to.equal(collaboration.userPublicKey)

      await deinitContactContext()
    })
  })

  describe('vault key rotation', () => {
    it("rotating a vault's key should send a key-change invite to all members", async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaultService.rotateVaultKey(vault.uuid)

      const outboundInvites = await collaboration.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.vault_uuid).to.equal(vault.uuid)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_vault_data).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(collaboration.userPublicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a vault's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithUnacceptedButTrustedInvite()
      contactContext.lockSyncing()

      const originalOutboundInvites = await collaboration.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncVaultData = originalOutboundInvites[0].encrypted_vault_data

      await vaultService.rotateVaultKey(vault.uuid)

      const updatedOutboundInvites = await collaboration.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(1)

      const joinInvite = updatedOutboundInvites[0]
      expect(joinInvite.invite_type).to.equal('join')
      expect(joinInvite.encrypted_vault_data).to.not.be.undefined
      expect(joinInvite.encrypted_vault_data).to.not.equal(originalEncVaultData)

      await deinitContactContext()
    })

    it('should update both pending join and key-change invites instead of creating new ones', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      const thirdParty = await createContactContext()
      const thirdPartyContact = await createTrustedContactForUserOfContext(context, thirdParty.contactContext)
      await collaboration.inviteContactToVault(vault, thirdPartyContact, VaultPermission.Write)

      const originalOutboundInvites = await collaboration.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await vaultService.rotateVaultKey(vault.uuid)

      const updatedOutboundInvites = await collaboration.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(2)

      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'join')).to.not.be.undefined
      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'key-change')).to.not.be.undefined

      await deinitContactContext()
      await thirdParty.deinitContactContext()
    })

    it('key change invites should be automatically accepted by trusted contacts', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaultService.rotateVaultKey(vault.uuid)

      const acceptInviteSpy = sinon.spy(contactContext.collaboration, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate vault key after removing vault member', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const originalVaultKey = vaultService.getVaultKey(vault.uuid)

      await collaboration.removeUserFromVault(vault.uuid, contactContext.userUuid)

      const newVaultKey = vaultService.getVaultKey(vault.uuid)

      expect(newVaultKey.keyTimestamp).to.be.greaterThan(originalVaultKey.keyTimestamp)
      expect(newVaultKey.vaultKey).to.not.equal(originalVaultKey.vaultKey)

      await deinitContactContext()
    })
  })

  describe('permissions', async () => {
    it('non-admin user should not be able to create or update vault items keys with the server', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const vaultItemsKey = contactContext.items.getVaultItemsKeysForVault(vault.uuid)[0]

      await contactContext.items.changeItem(vaultItemsKey, () => {})
      const promise = contactContext.resolveWithConflicts()
      await contactContext.sync()

      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item).to.equal(ContentType.VaultItemsKey)

      await deinitContactContext()
    })

    it("vault user should not be able to change an item using an items key that does not match the vault's specified items key", async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
      await contactContext.sync()

      const newItemsKeyUuid = UuidGenerator.GenerateUuid()
      const newItemsKey = contactContext.encryption.createVaultItemsKey(newItemsKeyUuid, vault.uuid)
      await contactContext.items.insertItem(newItemsKey)

      const contactVault = contactContext.vaultService.vaultStorage.getVault(vault.uuid)
      contactContext.vaultService.vaultStorage.setVault(vault.uuid, {
        ...contactVault,
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
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite(VaultPermission.Read)
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
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
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.vaultService.addItemToVault(vault, note)
      await contactContext.sync()

      const promise = contactContext.resolveWithConflicts()
      await contactContext.vaultService.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(0)

      const duplicateNote = contactContext.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.be.undefined

      const existingNote = contactContext.items.findItem(note.uuid)
      expect(existingNote.vault_uuid).to.not.be.ok

      await deinitContactContext()
    })

    it('should create a non-vaulted copy if attempting to move item from vault to user and item belongs to someone else', async () => {
      const { note, vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      const promise = contactContext.resolveWithConflicts()
      await contactContext.vaultService.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = contactContext.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.vault_uuid).to.not.be.ok

      const existingNote = contactContext.items.findItem(note.uuid)
      expect(existingNote.vault_uuid).to.equal(vault.uuid)

      await deinitContactContext()
    })

    it('should created a non-vaulted copy if admin attempts to move item from vault to user if the item belongs to someone else', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const note = await contactContext.createSyncedNote('foo', 'bar')
      await contactContext.vaultService.addItemToVault(vault, note)
      await context.sync()

      const promise = context.resolveWithConflicts()
      await context.vaultService.moveItemFromVaultToUser(note)
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      const duplicateNote = context.findDuplicateNote(note.uuid)
      expect(duplicateNote).to.not.be.undefined
      expect(duplicateNote.vault_uuid).to.not.be.ok

      const existingNote = context.items.findItem(note.uuid)
      expect(existingNote.vault_uuid).to.equal(vault.uuid)

      await deinitContactContext()
    })
  })

  describe('sync errors and conflicts', () => {
    it('after leaving vault, attempting to sync previously vault item should result in VaultNotMemberError', async () => {
      const { vault, note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      await context.collaboration.removeUserFromVault(vault.uuid, contactContext.userUuid)

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.VaultNotMemberError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('attempting to modify note as read user should result in VaultInsufficientPermissionsError', async () => {
      const { note, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite(VaultPermission.Read)

      const promise = contactContext.resolveWithConflicts()
      await contactContext.changeNoteTitle(note, 'new title')
      const conflicts = await promise

      expect(conflicts.length).to.equal(1)
      expect(conflicts[0].type).to.equal(ConflictType.VaultInsufficientPermissionsError)
      expect(conflicts[0].unsaved_item.content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('should handle VaultNotMemberError by duplicating item to user non-vault', async () => {
      const { vault, note, contactContext, deinitContactContext } = await createVaultWithAcceptedInviteAndNote()

      await context.collaboration.removeUserFromVault(vault.uuid, contactContext.userUuid)

      await contactContext.changeNoteTitle(note, 'new title')

      const notes = contactContext.notes

      expec(notes.length).to.equal(1)
      expect(notes[0].title).to.equal('new title')
      expect(notes[0].vault_uuid).to.not.be.ok
      expect(notes[0].duplicate_of).to.equal(note.uuid)

      await deinitContactContext()
    })
  })

  describe('files', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to download vault file as collaborator', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      await contactContext.sync()

      const sharedFile = contactContext.items.findItem(uploadedFile.uuid)
      expect(sharedFile).to.not.be.undefined
      expect(sharedFile.remoteIdentifier).to.equal(uploadedFile.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(contactContext.files, sharedFile)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should be able to upload vault file as collaborator', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(contactContext.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      await context.sync()

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)

      await deinitContactContext()
    })

    it('should be able to delete vault file as write user', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite(VaultPermission.Write)
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(result).to.be.undefined

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.be.undefined

      await deinitContactContext()
    })

    it('should not be able to delete vault file as read user', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite(VaultPermission.Read)
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())

      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      await contactContext.sync()

      const file = contactContext.items.findItem(uploadedFile.uuid)
      const result = await contactContext.files.deleteFile(file)
      expect(isClientDisplayableError(result)).to.be.true

      const foundFile = contactContext.items.findItem(file.uuid)
      expect(foundFile).to.not.be.undefined

      await deinitContactContext()
    })

    it('should be able to download recently moved vault file as collaborator', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000)
      const addedFile = await vaultService.addItemToVault(vault, uploadedFile)

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
