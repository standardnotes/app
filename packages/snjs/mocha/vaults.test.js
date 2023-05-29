import * as Factory from './lib/factory.js'
import * as Files from './lib/Files.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('vaults', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let application
  let context
  let vaultService
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
      publicKey: contextImportingContactInfoFrom.application.vaultService.userPublicKey,
      contactUuid: contextImportingContactInfoFrom.userUuid,
    })

    return contact
  }

  const acceptAllInvites = async (inContext) => {
    const invites = inContext.vaultService.getCachedInboundInvites()
    for (const invite of invites) {
      const result = await inContext.vaultService.acceptInvite(invite)
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
    await vaultService.inviteContactToVault(vault, contact, permissions)
    await contactContext.sync()

    await createTrustedContactForUserOfContext(contactContext, context)

    return { vault, contact, contactContext, deinitContactContext }
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
    it('should create a vault', async () => {
      const vault = await vaultService.createVault()
      expect(vault).to.not.be.undefined

      const vaultItemsKeys = application.items.getVaultItemsKeysForVault(vault.uuid)
      expect(vaultItemsKeys.length).to.equal(1)

      const vaultItemsKey = vaultItemsKeys[0]
      expect(vaultItemsKey instanceof VaultItemsKey).to.be.true
      expect(vaultItemsKey.vault_uuid).to.equal(vault.uuid)
    })

    it('should add item to vault', async () => {
      const note = await context.createSyncedNote('foo', 'bar')
      const vault = await vaultService.createVault()

      await vaultService.addItemToVault(vault, note)

      const updatedNote = application.items.findItem(note.uuid)
      expect(updatedNote.vault_uuid).to.equal(vault.uuid)
    })

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

      await vaultService.inviteContactToVault(vault, contact, VaultPermission.Write)

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

      const originalVaultUsers = await vaultService.getVaultUsers(vault.uuid)
      expect(originalVaultUsers.length).to.equal(2)

      const result = await vaultService.removeUserFromVault(vault.uuid, contactContext.userUuid)

      expect(isClientDisplayableError(result)).to.be.false

      const updatedVaultUsers = await vaultService.getVaultUsers(vault.uuid)
      expect(updatedVaultUsers.length).to.equal(1)

      await deinitContactContext()
    })

    it('non-admin user should not be able to invite user', async () => {
      console.error('TODO: implement test case')
    })

    it('should leave vault', async () => {
      console.error('TODO: implement test case')
    })

    it('after leaving vault, attempting to sync previously vault item should not result in infinite upload/conflict cycle', async () => {
      console.error('TODO: implement test case')
    })

    it('leaving a vault should not remove any of the vault items from the server', async () => {})

    it('an item added to a vault should not have a user_uuid', async () => {})

    it('should return invited to vaults when fetching vaults from server', async () => {
      const { contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const vaults = await contactContext.vaultService.reloadVaults()

      expect(vaults.length).to.equal(1)

      await deinitContactContext()
    })

    it('canceling an invite should remove it from recipient pending invites', async () => {
      console.error('TODO: implement test case')
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

    it('should update vault name and description', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      await vaultService.changeVaultMetadata(vault.uuid, {
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

  describe('client timing', () => {
    it('should load data in the correct order at startup to allow shared items and their keys to decrypt', async () => {
      const appIdentifier = context.identifier
      const vault = await vaultService.createVault()
      const note = await context.createSyncedNote('foo', 'bar')
      await vaultService.addItemToVault(vault, note)
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
      const vault = await vaultService.createVault()

      await createTrustedContactForUserOfContext(contactContext, context)
      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)

      contactContext.lockSyncing()
      await vaultService.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)
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

      await context.vaultService.removeItemFromItsVault(note)

      await context.changeNoteTitleAndSync(note, 'new title')

      const receivedNote = contactContext.application.items.findItem(note.uuid)

      expect(receivedNote).to.not.be.undefined
      expect(receivedNote.title).to.not.equal('new title')
      expect(receivedNote.title).to.equal(note.title)

      await deinitContactContext()
    })

    it('should remove item from collaborated account when item is deleted permanently', async () => {
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

  describe('invites', () => {
    it('should invite contact to vault', async () => {
      const vault = await vaultService.createVault()
      const { contactContext, deinitContactContext } = await createContactContext()
      const contact = await createTrustedContactForUserOfContext(context, contactContext)

      const vaultInvite = await vaultService.inviteContactToVault(vault, contact, VaultPermission.Write)

      expect(vaultInvite).to.not.be.undefined
      expect(vaultInvite.vault_uuid).to.equal(vault.uuid)
      expect(vaultInvite.user_uuid).to.equal(contact.contactUuid)
      expect(vaultInvite.encrypted_vault_data).to.not.be.undefined
      expect(vaultInvite.inviter_public_key).to.equal(vaultService.userPublicKey)
      expect(vaultInvite.permissions).to.equal(VaultPermission.Write)
      expect(vaultInvite.updated_at_timestamp).to.not.be.undefined

      await deinitContactContext()
    })

    it('received invites from untrusted contact should not be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const vault = await vaultService.createVault()

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
      await vaultService.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)

      await contactContext.vaultService.downloadInboundInvites()
      expect(
        contactContext.vaultService.getTrustedSenderOfInvite(contactContext.vaultService.getCachedInboundInvites()[0]),
      ).to.be.undefined

      await deinitContactContext()
    })

    it('received invites from contact who becomes trusted after receipt of invite should be trusted', async () => {
      await context.createSyncedNote('foo', 'bar')
      const { contactContext, deinitContactContext } = await createContactContext()
      const vault = await vaultService.createVault()

      const currentContextContact = await createTrustedContactForUserOfContext(context, contactContext)
      await vaultService.inviteContactToVault(vault, currentContextContact, VaultPermission.Write)

      await contactContext.vaultService.downloadInboundInvites()
      expect(
        contactContext.vaultService.getTrustedSenderOfInvite(contactContext.vaultService.getCachedInboundInvites()[0]),
      ).to.be.undefined

      await createTrustedContactForUserOfContext(contactContext, context)

      expect(
        contactContext.vaultService.getTrustedSenderOfInvite(contactContext.vaultService.getCachedInboundInvites()[0]),
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
      await vaultService.inviteContactToVault(vault, contact, VaultPermission.Write)
      await contactContext.sync()

      const vaultInvite = contactContext.vaultService.getCachedInboundInvites()[0]
      expect(vaultInvite.inviter_public_key).to.equal(vaultService.userPublicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedVaultInvite = contactContext.vaultService.getCachedInboundInvites()[0]
      expect(updatedVaultInvite.inviter_public_key).to.equal(vaultService.userPublicKey)

      await deinitContactContext()
    })
  })

  describe('vault key rotation', () => {
    it("rotating a vault's key should send a key-change invite to all members", async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()
      contactContext.lockSyncing()

      await vaultService.rotateVaultKey(vault.uuid)

      const outboundInvites = await vaultService.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.vault_uuid).to.equal(vault.uuid)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_vault_data).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(vaultService.userPublicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a vault's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithUnacceptedButTrustedInvite()
      contactContext.lockSyncing()

      const originalOutboundInvites = await vaultService.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncVaultData = originalOutboundInvites[0].encrypted_vault_data

      await vaultService.rotateVaultKey(vault.uuid)

      const updatedOutboundInvites = await vaultService.getOutboundInvites()
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
      await vaultService.inviteContactToVault(vault, thirdPartyContact, VaultPermission.Write)

      const originalOutboundInvites = await vaultService.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await vaultService.rotateVaultKey(vault.uuid)

      const updatedOutboundInvites = await vaultService.getOutboundInvites()
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

      const acceptInviteSpy = sinon.spy(contactContext.vaultService, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate vault key after removing vault member', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const originalVaultKey = vaultService.getVaultKey(vault.uuid)

      await vaultService.removeUserFromVault(vault.uuid, contactContext.userUuid)

      const newVaultKey = vaultService.getVaultKey(vault.uuid)

      expect(newVaultKey.keyTimestamp).to.be.greaterThan(originalVaultKey.keyTimestamp)
      expect(newVaultKey.vaultKey).to.not.equal(originalVaultKey.vaultKey)

      await deinitContactContext()
    })

    it('should keep vault key with greater keyTimestamp if conflict', async () => {
      const vault = await vaultService.createVault()
      const vaultKey = vaultService.getVaultKey(vault.uuid)

      const otherClient = await Factory.createAppContextWithRealCrypto()
      await otherClient.launch()
      otherClient.email = context.email
      otherClient.password = context.password
      await otherClient.signIn(context.email, context.password)

      context.lockSyncing()
      otherClient.lockSyncing()

      const olderTimestamp = vaultKey.keyTimestamp + 1
      const newerTimestamp = vaultKey.keyTimestamp + 2

      await context.application.items.changeItem(vaultKey, (mutator) => {
        mutator.content = {
          vaultKey: 'new-vault-key',
          keyTimestamp: olderTimestamp,
        }
      })

      const otherVaultKey = otherClient.vaultService.getVaultKey(vault.uuid)
      await otherClient.application.items.changeItem(otherVaultKey, (mutator) => {
        mutator.content = {
          vaultKey: 'new-vault-key',
          keyTimestamp: newerTimestamp,
        }
      })

      context.unlockSyncing()
      otherClient.unlockSyncing()

      await otherClient.sync()
      await context.sync()

      expect(context.items.getItems(ContentType.VaultKey).length).to.equal(1)
      expect(otherClient.items.getItems(ContentType.VaultKey).length).to.equal(1)

      const vaultKeyAfterSync = context.vaultService.getVaultKey(vault.uuid)
      const otherVaultKeyAfterSync = otherClient.vaultService.getVaultKey(vault.uuid)

      expect(vaultKeyAfterSync.keyTimestamp).to.equal(otherVaultKeyAfterSync.keyTimestamp)
      expect(vaultKeyAfterSync.vaultKey).to.equal(otherVaultKeyAfterSync.vaultKey)
      expect(vaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)
      expect(otherVaultKeyAfterSync.keyTimestamp).to.equal(newerTimestamp)

      await otherClient.deinit()
    })
  })

  describe('permissions', async () => {
    it('should not be able to update a vault with a keyTimestamp lower than the current one', async () => {
      const vault = await vaultService.createVault()
      const vaultKey = vaultService.getVaultKey(vault.uuid)

      const result = await vaultService.updateVault(vault.uuid, {
        vaultKeyTimestamp: vaultKey.keyTimestamp - 1,
        specifiedItemsKeyUuid: '123',
      })

      expect(isClientDisplayableError(result)).to.be.true
    })

    it('non-admin user should not be able to create or update shared items keys with the server', async () => {
      const { vault, contactContext, deinitContactContext } = await createVaultWithAcceptedInvite()

      const vaultItemsKey = contactContext.items.getVaultItemsKeysForVault(vault.uuid)[0]

      await contactContext.items.changeItem(vaultItemsKey, () => {})
      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()

      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(1)
      expect(rejectedPayloads[0].content_type).to.equal(ContentType.VaultItemsKey)

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

      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()
      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(2)
      expect(rejectedPayloads.find((payload) => payload.content_type === ContentType.Note)).to.not.be.undefined
      expect(rejectedPayloads.find((payload) => payload.content_type === ContentType.VaultItemsKey)).to.not.be.undefined

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

      const promise = contactContext.resolveWithRejectedPayloads()
      await contactContext.sync()
      const rejectedPayloads = await promise

      expect(rejectedPayloads.length).to.equal(1)
      expect(rejectedPayloads[0].content_type).to.equal(ContentType.Note)

      await deinitContactContext()
    })

    it('should be able to remove an item from a vault as a write user if the item belongs to me', async () => {
      console.error('TODO - implement test case')
    })

    it('should not be able to remove an item from a vault as a write user if the item belongs to someone else', async () => {
      console.error('TODO - implement test case')
    })

    it('should be able to remove an item from a vault as an admin user if the item belongs to someone else', async () => {
      console.error('TODO - implement test case')
    })
  })

  describe.only('files', () => {
    beforeEach(async () => {
      await context.publicMockSubscriptionPurchaseEvent()
    })

    it('should be able to upload and download file to vault as owner', async () => {
      const vault = await vaultService.createVault()
      const response = await fetch('/mocha/assets/small_file.md')
      const buffer = new Uint8Array(await response.arrayBuffer())
      const uploadedFile = await Files.uploadFile(context.files, buffer, 'my-file', 'md', 1000, vault.uuid)

      const file = context.items.findItem(uploadedFile.uuid)
      expect(file).to.not.be.undefined
      expect(file.remoteIdentifier).to.equal(file.remoteIdentifier)
      expect(file.vault_uuid).to.equal(vault.uuid)

      const downloadedBytes = await Files.downloadFile(context.files, file)
      expect(downloadedBytes).to.eql(buffer)
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

    it('should be able to move a user file to a vault', async () => {})
  })
})
