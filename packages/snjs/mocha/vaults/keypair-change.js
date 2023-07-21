import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('public keyset revocation', function () {
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

  it('contacts should be able to handle receiving multiple keypair changed messages and trust them in order', async () => {
    console.error('TODO: implement test')
  })

  it('should be able to revoke non-current keypair', async () => {
    const previousKeySet = context.contacts.getSelfContact().publicKeySet

    await context.changePassword('new-password')

    const result = await context.sharedVaults.revokeOwnKeySet(previousKeySet)

    expect(result.isFailed()).to.equal(false)

    const revokedKeySet = context.contacts.getSelfContact().publicKeySet.previousKeySet

    expect(revokedKeySet.isRevoked).to.equal(true)
  })

  it('should not be able to revoke current key pair', async () => {
    await context.changePassword('new-password')

    const currentKeySet = context.contacts.getSelfContact().publicKeySet
    const result = await context.sharedVaults.revokeOwnKeySet(currentKeySet)

    expect(result.isFailed()).to.equal(true)
    expect(result.getError()).to.equal('Cannot revoke current key set')
  })

  it('revoking a key should send a key revocation message to trusted contacts', async () => {
    const { contactContext, deinitContactContext } = await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const previousKeySet = context.contacts.getSelfContact().publicKeySet

    const previousContact = contactContext.contacts.findTrustedContact(context.userUuid)
    expect(previousContact.isPublicKeyTrusted(previousKeySet.encryption)).to.equal(true)
    expect(previousContact.isSigningKeyTrusted(previousKeySet.signing)).to.equal(true)

    await context.changePassword('new-password')

    await context.sharedVaults.revokeOwnKeySet(previousKeySet)

    contactContext.unlockSyncing()
    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedContact = contactContext.contacts.findTrustedContact(context.userUuid)
    expect(updatedContact.isPublicKeyTrusted(previousKeySet.encryption)).to.equal(false)
    expect(updatedContact.isSigningKeyTrusted(previousKeySet.signing)).to.equal(false)

    await deinitContactContext()
  })

  it('messages received with revoked key should be untrusted', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const previousKeySet = context.contacts.getSelfContact().publicKeySet

    await context.changePassword('new-password')
    await context.sharedVaults.revokeOwnKeySet(previousKeySet)

    contactContext.unlockSyncing()
    const completedProcessingMessagesPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    await contactContext.sync()
    await completedProcessingMessagesPromise

    const updatedVault = contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(updatedVault.name).to.not.equal('New Name')
    expect(updatedVault.description).to.not.equal('New Description')

    await deinitContactContext()
  })

  it('should delete invites sent with revoked key', async () => {
    const { contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)

    const previousKeySet = context.contacts.getSelfContact().publicKeySet

    await context.changePassword('new-password')

    await context.sharedVaults.revokeOwnKeySet(previousKeySet)

    const invites = await contactContext.sharedVaults.downloadInboundInvites()

    expect(invites.length).to.equal(0)

    await deinitContactContext()
  })

  it.only('should reupload asymmetric messages sent with old key', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.vaults.changeVaultNameAndDescription(sharedVault, {
      name: 'New Name',
      description: 'New Description',
    })

    const previousKeySet = context.contacts.getSelfContact().publicKeySet

    await context.changePassword('new-password')
    await context.sharedVaults.revokeOwnKeySet(previousKeySet)

    const messages = await contactContext.asymmetric.getInboundMessages()

    expect(messages.length).to.equal(0)

    await deinitContactContext()
  })
})
