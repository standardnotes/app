import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('asymmetric messages', function () {
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

  it('should not trust message if the trusted payload data recipientUuid does not match the message user uuid', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.changeVaultName(sharedVault, {
      name: 'new vault name',
      description: 'new vault description',
    })

    Object.defineProperty(contactContext.asymmetric.sessions, 'userUuid', {
      get: () => 'invalid user uuid',
    })

    contactContext.unlockSyncing()
    await contactContext.syncAndAwaitMessageProcessing()

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()

    expect(updatedVault.name).to.not.equal('new vault name')
    expect(updatedVault.description).to.not.equal('new vault description')

    await deinitContactContext()
  })

  it('should delete message after processing it', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const deleteFunction = sinon.spy(contactContext.asymmetric, 'deleteMessageAfterProcessing')

    await contactContext.syncAndAwaitMessageProcessing()

    expect(deleteFunction.callCount).to.equal(1)

    const messages = await contactContext.asymmetric.getInboundMessages()
    expect(messages.getValue().length).to.equal(0)

    await deinitContactContext()
  })

  it('should send contact share message after trusted contact belonging to group changes', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    const sendContactSharePromise = context.resolveWhenSharedVaultServiceSendsContactShareMessage()

    await context.contacts.createOrEditTrustedContact({
      contactUuid: thirdPartyContext.userUuid,
      publicKey: thirdPartyContext.publicKey,
      signingPublicKey: thirdPartyContext.signingPublicKey,
      name: 'Changed 3rd Party Name',
    })

    await sendContactSharePromise

    await contactContext.syncAndAwaitMessageProcessing()

    const updatedContact = contactContext.contacts.findContact(thirdPartyContext.userUuid)
    expect(updatedContact.name).to.equal('Changed 3rd Party Name')

    await deinitContactContext()
    await deinitThirdPartyContext()
  })

  it('should send contact share message when a member is added to a vault', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const handleInitialContactShareMessage = contactContext.resolveWhenAsyncFunctionCompletes(
      contactContext.asymmetric,
      'handleRemoteReceivedAsymmetricMessages',
    )

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedContactShareMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedContactShareMessage')
    const thirdPartySpy = sinon.spy(thirdPartyContext.asymmetric, 'handleTrustedContactShareMessage')

    await contactContext.sync()
    await handleInitialContactShareMessage

    await context.sync()
    await contactContext.sync()
    await thirdPartyContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)
    expect(thirdPartySpy.callCount).to.equal(0)

    await deinitThirdPartyContext()
    await deinitContactContext()
  })

  it('should not send contact share message to self or to contact who is changed', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteNewPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    await contactContext.sync()
    contactContext.lockSyncing()

    const sendContactSharePromise = context.resolveWhenSharedVaultServiceSendsContactShareMessage()

    await context.contacts.createOrEditTrustedContact({
      contactUuid: thirdPartyContext.userUuid,
      publicKey: thirdPartyContext.publicKey,
      signingPublicKey: thirdPartyContext.signingPublicKey,
      name: 'Changed 3rd Party Name',
    })

    await sendContactSharePromise

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedContactShareMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedContactShareMessage')
    const thirdPartySpy = sinon.spy(thirdPartyContext.asymmetric, 'handleTrustedContactShareMessage')

    await context.sync()
    contactContext.unlockSyncing()
    await contactContext.sync()
    await thirdPartyContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)
    expect(thirdPartySpy.callCount).to.equal(0)

    await deinitThirdPartyContext()
    await deinitContactContext()
  })

  it('should send shared vault root key change message after root key change', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.anticipateConsoleError(
      '(2x) Error decrypting contentKey from parameters',
      'Items keys are encrypted with new root key and are later decrypted in the test',
    )

    contactContext.lockSyncing()

    await context.vaults.rotateVaultRootKey(sharedVault)

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')

    await context.sync()

    contactContext.unlockSyncing()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    await deinitContactContext()
  })

  it('should send shared vault metadata change message after shared vault name change', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedVaultMetadataChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedVaultMetadataChangedMessage')

    await context.sync()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(updatedVault.name).to.equal('New Name')
    expect(updatedVault.description).to.equal('New Description')

    await deinitContactContext()
  })

  it('should send sender keypair changed message to trusted contacts', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.changePassword('new password')

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSenderKeypairChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    contactContext.unlockSyncing()
    await contactContext.syncAndAwaitMessageProcessing()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const contact = contactContext.contacts.findContact(context.userUuid)
    expect(contact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(contact.publicKeySet.signing).to.equal(context.signingPublicKey)

    await deinitContactContext()
  })

  it('should trust and process messages sent after sender keypair changed', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    await contactContext.syncAndAwaitMessageProcessing()

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(updatedVault.name).to.equal('New Name')
    expect(updatedVault.description).to.equal('New Description')

    await deinitContactContext()
  })

  it('should not send back a vault change message after receiving a vault change message', async () => {
    /**
     * If userA receives a vault change message and mutates their vault locally, this should not create a
     * chain of vault change messages that then ping-pongs back and forth between the two users.
     */
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    context.lockSyncing()

    await contactContext.syncAndAwaitMessageProcessing()

    /**
     * There's really no good way to await the exact call since
     * the relevant part fires in the SharedVaultSerivce item observer
     */
    await context.sleep(0.25)

    const messages = await context.asymmetric.getInboundMessages()
    expect(messages.getValue().length).to.equal(0)

    await deinitContactContext()
  })

  it('should process sender keypair changed message', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)
    const originalContact = contactContext.contacts.findContact(context.userUuid)

    await context.changePassword('new_password')

    await contactContext.syncAndAwaitMessageProcessing()

    const updatedContact = contactContext.contacts.findContact(context.userUuid)

    expect(updatedContact.publicKeySet.encryption).to.not.equal(originalContact.publicKeySet.encryption)
    expect(updatedContact.publicKeySet.signing).to.not.equal(originalContact.publicKeySet.signing)

    expect(updatedContact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(updatedContact.publicKeySet.signing).to.equal(context.signingPublicKey)

    await deinitContactContext()
  })

  it('sender keypair changed message should be signed using old key pair', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const oldKeyPair = context.keyPair
    const oldSigningKeyPair = context.signingKeyPair

    await context.changePassword('new password')

    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    await context.sync()
    await contactContext.syncAndAwaitMessageProcessing()

    const message = secondPartySpy.args[0][0]
    const encryptedMessage = message.encrypted_message

    const publicKeySet =
      contactContext.encryption.getSenderPublicKeySetFromAsymmetricallyEncryptedString(encryptedMessage)

    expect(publicKeySet.encryption).to.equal(oldKeyPair.publicKey)
    expect(publicKeySet.signing).to.equal(oldSigningKeyPair.publicKey)

    await deinitContactContext()
  })

  it('sender keypair changed message should contain new keypair and be trusted', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    const newKeyPair = context.keyPair
    const newSigningKeyPair = context.signingKeyPair

    await contactContext.syncAndAwaitMessageProcessing()

    const updatedContact = contactContext.contacts.findContact(context.userUuid)
    expect(updatedContact.publicKeySet.encryption).to.equal(newKeyPair.publicKey)
    expect(updatedContact.publicKeySet.signing).to.equal(newSigningKeyPair.publicKey)

    await deinitContactContext()
  })

  it('should delete all inbound messages after changing user password', async () => {
    /** Messages to user are encrypted with old keypair and are no longer decryptable */

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const promise = contactContext.resolveWhenAllInboundAsymmetricMessagesAreDeleted()
    await contactContext.changePassword('new-password')
    await promise

    const messages = await contactContext.asymmetric.getInboundMessages()
    expect(messages.getValue().length).to.equal(0)

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
    expect(updatedVault.name).to.not.equal('New Name')
    expect(updatedVault.description).to.not.equal('New Description')

    await deinitContactContext()
  })

  it('should be able to decrypt previously sent own messages', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.changeVaultName(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const usecase = context.application.dependencies.get(TYPES.ResendAllMessages)
    const result = await usecase.execute({
      keys: {
        encryption: context.keyPair,
        signing: context.signingKeyPair,
      },
      previousKeys: {
        encryption: context.keyPair,
        signing: context.signingKeyPair,
      },
    })

    expect(result.isFailed()).to.be.false

    await deinitContactContext()
  })

  it('sending a new vault invite to a trusted contact then changing account password should still allow contact to trust invite', async () => {
    await context.activatePaidSubscriptionForUser()

    const { contactContext, contact, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(
      context,
    )

    contactContext.lockSyncing()

    const newVault = await Collaboration.createSharedVault(context)

    await context.vaultInvites.inviteContactToSharedVault(
      newVault,
      contact,
      SharedVaultUserPermission.PERMISSIONS.Write,
    )

    await context.forceRefreshSession()
    await contactContext.forceRefreshSession()

    await context.changePassword('new password')

    await contactContext.forceRefreshSession()

    /**
     * When resending keypair changed messages here, we expect that one of their previous messages will fail to decrypt.
     * This is because the first contact keypair change message was encrypted using their keypair N (original), then after
     * the second password change, the reference to "previous" key will be N + 1 instead of N, so there is no longer a reference
     * to the original keypair. This is not a problem, and in fact even if the message were decryptable, it would be skipped
     * because we do not want to re-send keypair changed messages.
     */

    await context.changePassword('new password 2')

    await contactContext.forceRefreshSession()

    const messages = await contactContext.asymmetric.getInboundMessages()
    if (messages.isFailed()) {
      console.error(messages.getError())
    }

    expect(messages.isFailed()).to.be.false
    expect(messages.getValue().length).to.equal(2)

    contactContext.unlockSyncing()
    await contactContext.syncAndAwaitInviteAndMessageProcessing()

    const invites = contactContext.vaultInvites.getCachedPendingInviteRecords()
    expect(invites.length).to.equal(1)

    const invite = invites[0]
    expect(invite.trusted).to.equal(true)

    await contactContext.vaultInvites.acceptInvite(invite)

    await deinitContactContext()
  }).timeout(Factory.ThirtySecondTimeout)
})
