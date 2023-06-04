import * as Factory from '../lib/factory.js'
import * as Files from '../lib/Files.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe.only('shared vaults key rotation', function () {
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

  describe('user credentials change', () => {
    it('should reupload all outbound invites when inviter keypair changes', async () => {
      const sharedVault = await Collaboration.createSharedVault(context)
      const { contactContext, deinitContactContext } = await Collaboration.createContactContext()
      const contact = await Collaboration.createTrustedContactForUserOfContext(context, contactContext)
      await sharedVaults.inviteContactToSharedVault(sharedVault, contact, SharedVaultPermission.Write)
      await contactContext.sync()

      const vaultInvite = contactContext.sharedVaults.getCachedInboundInvites()[0]
      expect(vaultInvite.inviter_public_key).to.equal(context.publicKey)

      await context.changePassword('new-password')
      await context.sync()

      await contactContext.sync()

      const updatedSharedVaultInvite = contactContext.sharedVaults.getCachedInboundInvites()[0]
      expect(updatedSharedVaultInvite.inviter_public_key).to.equal(context.publicKey)

      await deinitContactContext()
    })
  })

  describe.only('key system root key rotation', () => {
    it("rotating a vault's key should send a key-change invite to all members", async () => {
      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      contactContext.lockSyncing()

      await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)

      const outboundInvites = await sharedVaults.getOutboundInvites()
      const keyChangeInvite = outboundInvites[0]

      expect(keyChangeInvite).to.not.be.undefined
      expect(keyChangeInvite.key_system_identifier).to.equal(sharedVault.systemIdentifier)
      expect(keyChangeInvite.user_uuid).to.equal(contactContext.userUuid)
      expect(keyChangeInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(keyChangeInvite.inviter_public_key).to.equal(context.publicKey)
      expect(keyChangeInvite.invite_type).to.equal('key-change')

      await deinitContactContext()
    })

    it("rotating a vault's key with a pending join invite should update that invite rather than creating a key-change invite ", async () => {
      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)
      contactContext.lockSyncing()

      const originalOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)
      const originalEncVaultData = originalOutboundInvites[0].encrypted_vault_key_content

      await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)

      const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(1)

      const joinInvite = updatedOutboundInvites[0]
      expect(joinInvite.invite_type).to.equal('join')
      expect(joinInvite.encrypted_vault_key_content).to.not.be.undefined
      expect(joinInvite.encrypted_vault_key_content).to.not.equal(originalEncVaultData)

      await deinitContactContext()
    })

    it('should update both pending join and key-change invites instead of creating new ones', async () => {
      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      contactContext.lockSyncing()

      const thirdParty = await Collaboration.createContactContext()
      const thirdPartyContact = await Collaboration.createTrustedContactForUserOfContext(
        context,
        thirdParty.contactContext,
      )
      await sharedVaults.inviteContactToSharedVault(sharedVault, thirdPartyContact, SharedVaultPermission.Write)

      const originalOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(originalOutboundInvites.length).to.equal(1)

      await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)

      const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
      expect(updatedOutboundInvites.length).to.equal(2)

      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'join')).to.not.be.undefined
      expect(updatedOutboundInvites.find((invite) => invite.invite_type === 'key-change')).to.not.be.undefined

      await deinitContactContext()
      await thirdParty.deinitContactContext()
    })

    it('key change invites should be automatically accepted by trusted contacts', async () => {
      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)
      contactContext.lockSyncing()

      await vaults.rotateKeySystemRootKey(sharedVault.systemIdentifier)

      const acceptInviteSpy = sinon.spy(contactContext.sharedVaults, 'acceptInvite')

      contactContext.unlockSyncing()
      await contactContext.sync()

      expect(acceptInviteSpy.callCount).to.equal(1)

      await deinitContactContext()
    })

    it('should rotate key system root key after removing vault member', async () => {
      const { sharedVault, contactContext, deinitContactContext } =
        await Collaboration.createSharedVaultWithAcceptedInvite(context)

      const originalKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

      await sharedVaults.removeUserFromSharedVault(sharedVaultUuid, contactContext.userUuid)

      const newKeySystemRootKey = context.items.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

      expect(newKeySystemRootKey.keyTimestamp).to.be.greaterThan(originalKeySystemRootKey.keyTimestamp)
      expect(newKeySystemRootKey.key).to.not.equal(originalKeySystemRootKey.key)

      await deinitContactContext()
    })
  })
})
