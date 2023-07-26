import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('asymmetric messages', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let service

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    service = context.asymmetric
  })

  it('should not trust message if the trusted payload data recipientUuid does not match the message user uuid', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'new vault name',
      description: 'new vault description',
    })

    Object.defineProperty(contactContext.asymmetric.sessions, 'userUuid', {
      get: () => 'invalid user uuid',
    })

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()

    contactContext.unlockSyncing()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })

    expect(updatedVault.name).to.not.equal('new vault name')
    expect(updatedVault.description).to.not.equal('new vault description')

    await deinitContactContext()
  })

  it('should delete message after processing it', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const eventData = {
      current: {
        encryption: context.encryption.getKeyPair(),
        signing: context.encryption.getSigningKeyPair(),
      },
      previous: {
        encryption: context.encryption.getKeyPair(),
        signing: context.encryption.getSigningKeyPair(),
      },
    }

    await context.contacts.sendOwnContactChangeEventToAllContacts(eventData)

    const deleteFunction = sinon.spy(contactContext.asymmetric, 'deleteMessageAfterProcessing')

    const promise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()

    await contactContext.sync()

    await promise

    expect(deleteFunction.callCount).to.equal(1)

    const messages = await contactContext.asymmetric.getInboundMessages()
    expect(messages.length).to.equal(0)

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

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()

    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedContact = contactContext.contacts.findContact(thirdPartyContext.userUuid)
    expect(updatedContact.name).to.equal('Changed 3rd Party Name')

    await deinitContactContext()
    await deinitThirdPartyContext()
  })

  it('should send contact share message when a member is added to a vault', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const handleInitialContactShareMessage = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()

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

    await context.vaults.rotateVaultRootKey(sharedVault)

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')

    await context.sync()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    await deinitContactContext()
  })

  it('should send shared vault metadata change message after shared vault name change', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedVaultMetadataChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedVaultMetadataChangedMessage')

    await context.sync()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(updatedVault.name).to.equal('New Name')
    expect(updatedVault.description).to.equal('New Description')

    await deinitContactContext()
  })

  it.skip('should send sender keypair changed message to trusted contacts', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const sendPromise = context.resolveWhenAsyncFunctionCompletes(
      context.contacts,
      'sendOwnContactChangeEventToAllContacts',
    )
    await context.changePassword('new password')
    await sendPromise

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSenderKeypairChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    contactContext.unlockSyncing()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const contact = contactContext.contacts.findContact(context.userUuid)
    expect(contact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(contact.publicKeySet.signing).to.equal(context.signingPublicKey)

    await deinitContactContext()
  })

  it.skip('should trust and process messages sent after sender keypair changed', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
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

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    context.lockSyncing()

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    /**
     * There's really no good way to await the exact call since
     * the relevant part fires in the SharedVaultSerivce item observer
     */
    await context.sleep(0.25)

    const messages = await context.asymmetric.getInboundMessages()
    expect(messages.length).to.equal(0)

    await deinitContactContext()
  })

  it('should process sender keypair changed message', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await Collaboration.createTrustedContactForUserOfContext(contactContext, context)
    const originalContact = contactContext.contacts.findContact(context.userUuid)

    await context.changePassword('new_password')

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedContact = contactContext.contacts.findContact(context.userUuid)

    expect(updatedContact.publicKeySet.encryption).to.not.equal(originalContact.publicKeySet.encryption)
    expect(updatedContact.publicKeySet.signing).to.not.equal(originalContact.publicKeySet.signing)

    expect(updatedContact.publicKeySet.encryption).to.equal(context.publicKey)
    expect(updatedContact.publicKeySet.signing).to.equal(context.signingPublicKey)

    await deinitContactContext()
  })

  it.skip('sender keypair changed message should be signed using old key pair', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const oldKeyPair = context.encryption.getKeyPair()
    const oldSigningKeyPair = context.encryption.getSigningKeyPair()

    await context.changePassword('new password')

    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    await context.sync()
    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const message = secondPartySpy.args[0][0]
    const encryptedMessage = message.encrypted_message

    const publicKeySet =
      contactContext.encryption.getSenderPublicKeySetFromAsymmetricallyEncryptedString(encryptedMessage)

    expect(publicKeySet.encryption).to.equal(oldKeyPair.publicKey)
    expect(publicKeySet.signing).to.equal(oldSigningKeyPair.publicKey)

    await deinitContactContext()
  })

  it.skip('sender keypair changed message should contain new keypair and be trusted', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    const newKeyPair = context.encryption.getKeyPair()
    const newSigningKeyPair = context.encryption.getSigningKeyPair()

    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedContact = contactContext.contacts.findContact(context.userUuid)
    expect(updatedContact.publicKeySet.encryption).to.equal(newKeyPair.publicKey)
    expect(updatedContact.publicKeySet.signing).to.equal(newSigningKeyPair.publicKey)

    await deinitContactContext()
  })

  it.skip('should delete all inbound messages after changing user password', async () => {
    /** Messages to user are encrypted with old keypair and are no longer decryptable */

    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const promise = contactContext.resolveWhenAllInboundAsymmetricMessagesAreDeleted()
    await contactContext.changePassword('new-password')
    await promise

    const messages = await contactContext.asymmetric.getInboundMessages()
    expect(messages.length).to.equal(0)

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(updatedVault.name).to.not.equal('New Name')
    expect(updatedVault.description).to.not.equal('New Description')

    await deinitContactContext()
  })
})
