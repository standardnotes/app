import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('asymmetric messages', function () {
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

  it('should delete message after processing it', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const eventData = {
      oldKeyPair: context.encryption.getKeyPair(),
      oldSigningKeyPair: context.encryption.getSigningKeyPair(),
      newKeyPair: context.encryption.getKeyPair(),
      newSigningKeyPair: context.encryption.getSigningKeyPair(),
    }

    await service.sendOwnContactChangeEventToAllContacts(eventData)

    const deleteFunction = sinon.spy(contactContext.asymmetric, 'deleteMessageAfterProcessing')

    await contactContext.sync()

    expect(deleteFunction.callCount).to.equal(1)

    const messages = await contactContext.asymmetric.getInboundMessages()
    expect(messages.length).to.equal(0)

    await deinitContactContext()
  })

  it('should send contact share message after trusted contact belonging to group changes', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteThirdPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    /** Change third party contact information */
    await context.contacts.createOrEditTrustedContact({
      contactUuid: thirdPartyContext.userUuid,
      publicKey: thirdPartyContext.encryption.getPublicKey(),
      signingPublicKey: thirdPartyContext.encryption.getSigningPublicKey(),
      name: 'Changed 3rd Party Name',
    })

    /** Expect second party to receive new name update */
    await contactContext.sync()

    const updatedContact = contactContext.contacts.findTrustedContact(thirdPartyContext.userUuid)
    expect(updatedContact.name).to.equal('Changed 3rd Party Name')

    await deinitContactContext()
    await deinitThirdPartyContext()
  })

  it('should not send contact share message to self or to contact who is changed', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const { thirdPartyContext, deinitThirdPartyContext } = await Collaboration.inviteThirdPartyToSharedVault(
      context,
      sharedVault,
    )

    await Collaboration.acceptAllInvites(thirdPartyContext)

    /** Change third party contact information */
    await context.contacts.createOrEditTrustedContact({
      contactUuid: thirdPartyContext.userUuid,
      publicKey: thirdPartyContext.encryption.getPublicKey(),
      signingPublicKey: thirdPartyContext.encryption.getSigningPublicKey(),
      name: 'Changed 3rd Party Name',
    })

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedContactShareMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedContactShareMessage')
    const thirdPartySpy = sinon.spy(thirdPartyContext.contactContext.asymmetric, 'handleTrustedContactShareMessage')

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

  it('should send shared vault root key change message after shared vault name change', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')

    await context.sync()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const updatedVault = contactContext.vaults.getVault(sharedVault.systemIdentifier)
    expect(updatedVault.name).to.equal('New Name')
    expect(updatedVault.description).to.equal('New Description')

    await deinitContactContext()
  })

  it('should send sender keypair changed message to trusted contacts', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    await context.changePassword('new password')

    const firstPartySpy = sinon.spy(context.asymmetric, 'handleTrustedSenderKeypairChangedMessage')
    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    await context.sync()
    await contactContext.sync()

    expect(firstPartySpy.callCount).to.equal(0)
    expect(secondPartySpy.callCount).to.equal(1)

    const contact = contactContext.contacts.findTrustedContact(context.userUuid)
    expect(contact.publicKeySet.encryption).to.equal(context.encryption.getPublicKey())
    expect(contact.publicKeySet.signing).to.equal(context.encryption.getSigningPublicKey())

    await deinitContactContext()
  })

  it('sender keypair changed message should be signed using old key pair', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const oldKeyPair = context.encryption.getKeypair()
    const oldSigningKeyPair = context.encryption.getSigningKeypair()

    await context.changePassword('new password')

    const secondPartySpy = sinon.spy(contactContext.asymmetric, 'handleTrustedSenderKeypairChangedMessage')

    await context.sync()
    await contactContext.sync()

    const message = secondPartySpy.args[0]
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

    const newKeyPair = context.encryption.getKeypair()
    const newSigningKeyPair = context.encryption.getSigningKeypair()

    await contactContext.sync()

    const updatedContact = contactContext.contacts.findTrustedContact(context.userUuid)
    expect(updatedContact.publicKeySet.encryption).to.equal(newKeyPair.publicKey)
    expect(updatedContact.publicKeySet.signing).to.equal(newSigningKeyPair.publicKey)

    await deinitContactContext()
  })
})
