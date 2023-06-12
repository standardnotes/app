import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('shared vault key rotation', function () {
  this.timeout(Factory.TwentySecondTimeout)

  let context
  let vaults
  let sharedVaults

  afterEach(async function () {
    await context.deinit()
    localStorage.clear()
  })

  beforeEach(async function () {
    localStorage.clear()

    context = await Factory.createAppContextWithRealCrypto()

    await context.launch()
    await context.register()

    vaults = context.vaults
    sharedVaults = context.sharedVaults
  })

  it('should reupload all outbound invites when inviter keypair changes', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)
    const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
    const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
    await sharedVaults.inviteContactToSharedVault(sharedVault, contact, SharedVaultPermission.Write)
    await contactContext.sync()

    const originalInviteRecord = contactContext.sharedVaults.getCachedPendingInviteRecords()[0]

    await context.changePassword('new-password')
    await context.sync()

    await contactContext.sync()

    const updatedInviteRecord = contactContext.sharedVaults.getCachedPendingInviteRecords()[0]
    expect(updatedInviteRecord.encrypted_message).to.not.equal(originalInviteRecord.invite.encrypted_message)

    await deinitContactContext()
  })

  it("rotating a vault's key should send an asymmetric message to all members", async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    contactContext.lockSyncing()

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault.systemIdentifier)
    await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)
    await promise

    const outboundMessages = await context.asymmetric.getOutboundMessages()
    expect(outboundMessages.length).to.equal(1)

    const keyChangeMessage = outboundMessages[0]
    expect(keyChangeMessage).to.not.be.undefined
    expect(keyChangeMessage.user_uuid).to.equal(contactContext.userUuid)
    expect(keyChangeMessage.encrypted_message).to.not.be.undefined

    await deinitContactContext()
  })

  it("rotating a vault's key with a pending invite should update that invite rather than creating a key-change invite ", async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)
    contactContext.lockSyncing()

    const originalOutboundInvites = await sharedVaults.getOutboundInvites()
    expect(originalOutboundInvites.length).to.equal(1)
    const originalInviteMessage = originalOutboundInvites[0].encrypted_message

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault.systemIdentifier)
    await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)
    await promise

    const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
    expect(updatedOutboundInvites.length).to.equal(1)

    const joinInvite = updatedOutboundInvites[0]
    expect(joinInvite.encrypted_message).to.not.be.undefined
    expect(joinInvite.encrypted_message).to.not.equal(originalInviteMessage)

    await deinitContactContext()
  })

  it.only('should update existing key-change messages instead of creating new ones', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    contactContext.lockSyncing()

    const firstPromise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault.systemIdentifier)
    await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)
    await firstPromise

    const asymmetricMessageAfterFirstChange = await context.asymmetric.getOutboundMessages()
    expect(asymmetricMessageAfterFirstChange.length).to.equal(1)
    const messageAfterFirstChange = asymmetricMessageAfterFirstChange[0]

    const secondPromise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault.systemIdentifier)
    await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)
    await secondPromise

    const asymmetricMessageAfterSecondChange = await context.asymmetric.getOutboundMessages()
    expect(asymmetricMessageAfterSecondChange.length).to.equal(1)
    const messageAfterSecondChange = asymmetricMessageAfterSecondChange[0]

    expect(messageAfterSecondChange.encrypted_message).to.not.equal(messageAfterFirstChange.encrypted_message)

    await deinitContactContext()
  })

  it.only('key change invites should be automatically accepted by trusted contacts', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)
    contactContext.lockSyncing()

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault.systemIdentifier)
    await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)
    await promise

    const acceptInviteSpy = sinon.spy(contactContext.sharedVaults, 'acceptInvite')

    contactContext.unlockSyncing()
    await contactContext.sync()

    expect(acceptInviteSpy.callCount).to.equal(1)

    await deinitContactContext()
  })

  it.only('should rotate key system root key after removing vault member', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const originalKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    await sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    const newKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    expect(newKeySystemRootKey.keyTimestamp).to.be.greaterThan(originalKeySystemRootKey.keyTimestamp)
    expect(newKeySystemRootKey.key).to.not.equal(originalKeySystemRootKey.key)

    await deinitContactContext()
  })
})
