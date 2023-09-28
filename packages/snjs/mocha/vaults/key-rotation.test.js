import * as Factory from '../lib/factory.js'
import * as Collaboration from '../lib/Collaboration.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('vault key rotation', function () {
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

  it('should reencrypt all items keys belonging to key system', async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    const callSpy = sinon.spy(context.keys, 'queueVaultItemsKeysForReencryption')
    const syncSpy = context.spyOnFunctionResult(context.application.sync, 'payloadsByPreparingForServer')

    await context.vaults.rotateVaultRootKey(sharedVault)
    await syncSpy

    expect(callSpy.callCount).to.equal(1)

    const payloads = await syncSpy
    const keyPayloads = payloads.filter((payload) => payload.content_type === ContentType.TYPES.KeySystemItemsKey)
    expect(keyPayloads.length).to.equal(2)

    const vaultRootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    for (const payload of keyPayloads) {
      const keyParams = context.encryption.getEmbeddedPayloadAuthenticatedData(new EncryptedPayload(payload)).kp
      expect(keyParams).to.eql(vaultRootKey.keyParams)
    }

    deinitContactContext()
  })

  it('should update value of local storage mode key', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Local,
    })

    const beforeKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)

    await context.vaults.rotateVaultRootKey(vault, 'test password')

    const afterKey = context.keys.getRootKeyFromStorageForVault(vault.systemIdentifier)

    expect(afterKey.keyParams.creationTimestamp).to.be.greaterThan(beforeKey.keyParams.creationTimestamp)
    expect(afterKey.key).to.not.equal(beforeKey.key)
    expect(afterKey.itemsKey).to.not.equal(beforeKey.itemsKey)
  })

  it('should update value of mem storage mode key', async () => {
    const vault = await context.vaults.createUserInputtedPasswordVault({
      name: 'test vault',
      userInputtedPassword: 'test password',
      storagePreference: KeySystemRootKeyStorageMode.Ephemeral,
    })

    const beforeKey = context.keys.getMemCachedRootKey(vault.systemIdentifier)

    await context.vaults.rotateVaultRootKey(vault, 'test password')

    const afterKey = context.keys.getMemCachedRootKey(vault.systemIdentifier)

    expect(afterKey.keyParams.creationTimestamp).to.be.greaterThan(beforeKey.keyParams.creationTimestamp)
    expect(afterKey.key).to.not.equal(beforeKey.key)
    expect(afterKey.itemsKey).to.not.equal(beforeKey.itemsKey)
  })

  it("rotating a vault's key should send an asymmetric message to all members", async () => {
    const { sharedVault, contactContext, deinitContactContext } =
      await Collaboration.createSharedVaultWithAcceptedInvite(context)

    contactContext.lockSyncing()

    await context.vaults.rotateVaultRootKey(sharedVault)

    const outboundMessages = (await context.asymmetric.getOutboundMessages()).getValue()
    const expectedMessages = ['root key change']
    expect(outboundMessages.length).to.equal(expectedMessages.length)

    const message = outboundMessages[0]
    expect(message).to.not.be.undefined
    expect(message.recipient_uuid).to.equal(contactContext.userUuid)
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

    await context.vaults.rotateVaultRootKey(sharedVault)

    const rootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    contactContext.unlockSyncing()
    await contactContext.sync()

    const vault = await contactContext.vaults.getVault({ keySystemIdentifier: sharedVault.systemIdentifier }).getValue()
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

    await context.vaults.rotateVaultRootKey(sharedVault)

    contactContext.unlockSyncing()
    await contactContext.syncAndAwaitMessageProcessing()

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

    const originalOutboundInvites = await context.vaultInvites.getOutboundInvites()
    expect(originalOutboundInvites.length).to.equal(1)
    const originalInviteMessage = originalOutboundInvites[0].encrypted_message

    await context.vaults.rotateVaultRootKey(sharedVault)

    const updatedOutboundInvites = await context.vaultInvites.getOutboundInvites()
    expect(updatedOutboundInvites.length).to.equal(1)

    const joinInvite = updatedOutboundInvites[0]
    expect(joinInvite.encrypted_message).to.not.be.undefined
    expect(joinInvite.encrypted_message).to.not.equal(originalInviteMessage)

    await deinitContactContext()
  })

  it('new key system items key in rotated shared vault should belong to shared vault', async () => {
    const sharedVault = await Collaboration.createSharedVault(context)

    await context.vaults.rotateVaultRootKey(sharedVault)

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

    await context.vaults.rotateVaultRootKey(sharedVault)

    const asymmetricMessageAfterFirstChange = (await context.asymmetric.getOutboundMessages()).getValue()
    const expectedMessages = ['root key change']
    expect(asymmetricMessageAfterFirstChange.length).to.equal(expectedMessages.length)

    const messageAfterFirstChange = asymmetricMessageAfterFirstChange[0]

    await context.vaults.rotateVaultRootKey(sharedVault)

    const asymmetricMessageAfterSecondChange = (await context.asymmetric.getOutboundMessages()).getValue()
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

    await context.vaults.rotateVaultRootKey(sharedVault)

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

    await context.vaultUsers.removeUserFromSharedVault(sharedVault, contactContext.userUuid)

    const newKeySystemRootKey = context.keys.getPrimaryKeySystemRootKey(sharedVault.systemIdentifier)

    expect(newKeySystemRootKey.keyParams.creationTimestamp).to.be.greaterThan(
      originalKeySystemRootKey.keyParams.creationTimestamp,
    )
    expect(newKeySystemRootKey.key).to.not.equal(originalKeySystemRootKey.key)

    await deinitContactContext()
  })
})
