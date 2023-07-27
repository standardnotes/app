import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('keypair change', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()
  })

  it.skip('contacts should be able to handle receiving multiple keypair changed messages and trust them in order', async () => {
    const { note, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    contactContext.lockSyncing()

    const publicKeyChain = []
    const signingPublicKeyChain = []

    publicKeyChain.push(context.publicKey)
    signingPublicKeyChain.push(context.signingPublicKey)

    await context.changePassword('new_password')
    publicKeyChain.push(context.publicKey)
    signingPublicKeyChain.push(context.signingPublicKey)

    await context.changePassword('new_password-2')
    publicKeyChain.push(context.publicKey)
    signingPublicKeyChain.push(context.signingPublicKey)

    await context.changePassword('new_password-3')
    publicKeyChain.push(context.publicKey)
    signingPublicKeyChain.push(context.signingPublicKey)

    await context.changeNoteTitleAndSync(note, 'new title')

    contactContext.unlockSyncing()
    const promise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await promise

    const originatorContact = contactContext.contacts.findContact(context.userUuid)
    let currentKeySet = originatorContact.publicKeySet
    for (let i = publicKeyChain.length - 1; i >= 0; i--) {
      const publicKey = publicKeyChain[i]
      const signingPublicKey = signingPublicKeyChain[i]
      expect(currentKeySet.encryption).to.equal(publicKey)
      expect(currentKeySet.signing).to.equal(signingPublicKey)
      currentKeySet = currentKeySet.previousKeySet
    }

    const receivedNote = contactContext.items.findItem(note.uuid)
    expect(receivedNote.title).to.equal('new title')
    expect(receivedNote.signatureData.required).to.be.true
    expect(receivedNote.signatureData.result.passes).to.be.true

    await deinitContactContext()
  })

  it('should not trust messages sent with previous key pair', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    contactContext.lockSyncing()

    const previousKeyPair = context.encryption.getKeyPair()
    const previousSigningKeyPair = context.encryption.getSigningKeyPair()

    await context.changePassword('new_password')

    sinon.stub(context.encryption, 'getKeyPair').returns(previousKeyPair)
    sinon.stub(context.encryption, 'getSigningKeyPair').returns(previousSigningKeyPair)

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    contactContext.unlockSyncing()
    const promise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await promise

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(updatedVault.name).to.equal(sharedVault.name)
    expect(updatedVault.description).to.equal(sharedVault.description)
    expect(updatedVault.name).to.not.equal('New Name')
    expect(updatedVault.description).to.not.equal('New Description')

    await deinitContactContext()
  })

  it('should reupload invites after rotating keypair', async () => {
    const { contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)

    contactContext.lockSyncing()

    const invite = (await contactContext.vaultInvites.downloadInboundInvites())[0]

    const promise = context.resolveWhenAsyncFunctionCompletes(
      context.application.dependencies.get(TYPES.SendVaultInvite),
      'execute',
    )
    await context.changePassword('new_password')
    await promise

    const updatedInvite = (await contactContext.vaultInvites.downloadInboundInvites())[0]
    expect(updatedInvite.uuid).to.not.equal(invite.uuid)
    expect(updatedInvite.created_at_timestamp).to.not.equal(invite.created_at_timestamp)

    await deinitContactContext()
  })

  it('should reupload asymmetric messages after rotating keypair', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInviteAndNote(context)

    contactContext.lockSyncing()

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const originalMessages = await contactContext.asymmetric.getInboundMessages()
    expect(originalMessages.length).to.equal(1)
    const originalMessage = originalMessages[0]

    const promise = context.resolveWhenAsyncFunctionCompletes(
      context.application.dependencies.get(TYPES.HandleKeyPairChange),
      'execute',
    )
    await context.changePassword('new_password')
    await promise

    const updatedMessages = await contactContext.asymmetric.getInboundMessages()
    const expectedMessages = ['keypair-change', 'vault-change']
    expect(updatedMessages.length).to.equal(expectedMessages.length)

    expect(updatedMessages.some((message) => message.uuid === originalMessage.uuid)).to.be.false
    expect(updatedMessages.some((message) => message.created_at_timestamp === originalMessage.created_at_timestamp)).to
      .be.false

    await deinitContactContext()
  })
})
