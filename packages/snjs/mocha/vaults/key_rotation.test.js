import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('shared vault key rotation', function () {
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

  it('should reencrypt all items keys belonging to key system', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const spy = sinon.spy(context.encryption, 'reencryptKeySystemItemsKeysForVault')

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    expect(spy.callCount).to.equal(1)

    deinitContactContext()
  })

  it("rotating a vault's key should send an asymmetric message to all members", async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    const outboundMessages = await context.asymmetric.getOutboundMessages()
    const expectedMessages = ['root key change', 'vault metadata change']
    expect(outboundMessages.length).to.equal(expectedMessages.length)

    const message = outboundMessages[0]
    expect(message).to.not.be.undefined
    expect(message.user_uuid).to.equal(contactContext.userUuid)
    expect(message.encrypted_message).to.not.be.undefined

    await deinitContactContext()
  })

  it('should update recipient vault display listing with new key params', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.anticipateConsoleError(
      '(2x) Error decrypting contentKey from parameters',
      'Items keys are encrypted with new root key and are later decrypted in the test',
    )

    contactContext.lockSyncing()

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    const rootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    contactContext.unlockSyncing()
    await contactContext.sync()

    const vault = await contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier })
    expect(vault.rootKeyParams).to.eql(rootKey.keyParams)

    await deinitContactContext()
  })

  it('should receive new key system items key', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.anticipateConsoleError(
      '(2x) Error decrypting contentKey from parameters',
      'Items keys are encrypted with new root key and are later decrypted in the test',
    )
    contactContext.lockSyncing()

    const previousPrimaryItemsKey = contactContext.keys.getPrimaryKeySystemItemsKey(sharedVault.systemIdentifier)
    expect(previousPrimaryItemsKey).to.not.be.undefined

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    const contactPromise = contactContext.resolveWhenAsymmetricMessageProcessingCompletes()
    contactContext.unlockSyncing()
    await contactContext.sync()
    await contactPromise

    const newPrimaryItemsKey = contactContext.keys.getPrimaryKeySystemItemsKey(sharedVault.systemIdentifier)
    expect(newPrimaryItemsKey).to.not.be.undefined

    expect(newPrimaryItemsKey.uuid).to.not.equal(previousPrimaryItemsKey.uuid)
    expect(newPrimaryItemsKey.itemsKey).to.not.eql(previousPrimaryItemsKey.itemsKey)

    await deinitContactContext()
  })

  it("rotating a vault's key with a pending invite should create new invite and delete old", async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithUnacceptedButTrustedInvite(context)
    contactContext.lockSyncing()

    const originalOutboundInvites = await sharedVaults.getOutboundInvites()
    expect(originalOutboundInvites.length).to.equal(1)
    const originalInviteMessage = originalOutboundInvites[0].encrypted_message

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    const updatedOutboundInvites = await sharedVaults.getOutboundInvites()
    expect(updatedOutboundInvites.length).to.equal(1)

    const joinInvite = updatedOutboundInvites[0]
    expect(joinInvite.encrypted_message).to.not.be.undefined
    expect(joinInvite.encrypted_message).to.not.equal(originalInviteMessage)

    await deinitContactContext()
  })

  it('new key system items key in rotated shared vault should belong to shared vault', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    await vaults.rotateVaultRootKey(sharedVault)

    const keySystemItemsKeys = context.keys
      .getAllKeySystemItemsKeys()
      .filter((key) => key.key_system_identifier === sharedVault.systemIdentifier)

    expect(keySystemItemsKeys.length).to.equal(2)

    for (const key of keySystemItemsKeys) {
      expect(key.shared_vault_uuid).to.equal(sharedVault.sharing.sharedVaultUuid)
    }
  })

  it('should update existing key-change messages instead of creating new ones', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const firstPromise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await firstPromise

    const asymmetricMessageAfterFirstChange = await context.asymmetric.getOutboundMessages()
    const expectedMessages = ['root key change', 'vault metadata change']
    expect(asymmetricMessageAfterFirstChange.length).to.equal(expectedMessages.length)

    const messageAfterFirstChange = asymmetricMessageAfterFirstChange[0]

    const secondPromise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await secondPromise

    const asymmetricMessageAfterSecondChange = await context.asymmetric.getOutboundMessages()
    expect(asymmetricMessageAfterSecondChange.length).to.equal(expectedMessages.length)

    const messageAfterSecondChange = asymmetricMessageAfterSecondChange[0]
    expect(messageAfterSecondChange.encrypted_message).to.not.equal(messageAfterFirstChange.encrypted_message)
    expect(messageAfterSecondChange.uuid).to.not.equal(messageAfterFirstChange.uuid)

    await deinitContactContext()
  })

  it('key change messages should be automatically processed by trusted contacts', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.anticipateConsoleError(
      '(2x) Error decrypting contentKey from parameters',
      'Items keys are encrypted with new root key and are later decrypted in the test',
    )
    contactContext.lockSyncing()

    const promise = context.resolveWhenSharedVaultKeyRotationInvitesGetSent(sharedVault)
    await vaults.rotateVaultRootKey(sharedVault)
    await promise

    const acceptMessage = sinon.spy(contactContext.asymmetric, 'handleTrustedSharedVaultRootKeyChangedMessage')

    contactContext.unlockSyncing()
    await contactContext.sync()

    expect(acceptMessage.callCount).to.equal(1)

    await deinitContactContext()
  })

  it('should rotate key system root key after removing vault member', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    const originalKeySystemRootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    await sharedVaults.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    const newKeySystemRootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    expect(newKeySystemRootKey.keyParams.creationTimestamp).to.be.greaterThan(
      originalKeySystemRootKey.keyParams.creationTimestamp,
    )
    expect(newKeySystemRootKey.key).to.not.equal(originalKeySystemRootKey.key)

    await deinitContactContext()
  })

  it('should throw if attempting to change password of locked vault', async () => {
    console.error('TODO: implement')
  })

  it('should respect storage preference when rotating key system root key', async () => {
    console.error('TODO: implement')
  })

  it('should change storage preference from synced to local', async () => {
    console.error('TODO: implement')
  })

  it('should change storage preference from local to synced', async () => {
    console.error('TODO: implement')
  })

  it('should resync key system items key if it is encrypted with noncurrent key system root key', async () => {
    console.error('TODO: implement')
  })

  it('should change password type from user inputted to randomized', async () => {
    console.error('TODO: implement')
  })

  it('should change password type from randomized to user inputted', async () => {
    console.error('TODO: implement')
  })

  it('should not be able to change storage mode of third party vault', async () => {
    console.error('TODO: implement')
  })
})
