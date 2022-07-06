/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('key recovery service', function () {
  this.timeout(Factory.TwentySecondTimeout)

  const syncOptions = {
    checkIntegrity: true,
    awaitAll: true,
  }

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(function () {
    localStorage.clear()
  })

  it('when encountering an undecryptable items key, should recover through recovery wizard', async function () {
    const namespace = Factory.randomString()
    const context = await Factory.createAppContextWithFakeCrypto(namespace)
    const unassociatedPassword = 'randfoo'
    const unassociatedIdentifier = 'foorand'

    const application = context.application
    await context.launch({
      receiveChallenge: (challenge) => {
        application.submitValuesForChallenge(challenge, [
          CreateChallengeValue(challenge.prompts[0], unassociatedPassword),
        ])
      },
    })

    await context.register()

    const randomRootKey = await application.protocolService.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )
    const randomItemsKey = await application.protocolService.operatorManager.defaultOperator().createItemsKey()

    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    const errored = await application.protocolService.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })

    expect(errored.errorDecrypting).to.equal(true)

    await application.payloadManager.emitPayload(errored, PayloadEmitSource.LocalInserted)

    await context.resolveWhenKeyRecovered(errored.uuid)

    expect(application.items.findItem(errored.uuid).errorDecrypting).to.not.be.ok

    expect(application.syncService.isOutOfSync()).to.equal(false)
    await context.deinit()
  })

  it('recovered keys with key params not matching servers should be synced if local root key does matches server', async function () {
    /**
     * This helps ensure server always has the most valid state,
     * in case the recovery is being initiated from a server value in the first place
     */
    const context = await Factory.createAppContextWithFakeCrypto()
    const unassociatedPassword = 'randfoo'
    const unassociatedIdentifier = 'foorand'

    const application = context.application

    await context.launch({
      receiveChallenge: (challenge) => {
        application.submitValuesForChallenge(challenge, [
          CreateChallengeValue(challenge.prompts[0], unassociatedPassword),
        ])
      },
    })
    await context.register()

    const randomRootKey = await application.protocolService.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )

    const randomItemsKey = await application.protocolService.operatorManager.defaultOperator().createItemsKey()

    await application.payloadManager.emitPayload(
      randomItemsKey.payload.copy({ dirty: true, dirtyIndex: getIncrementedDirtyIndex() }),
      PayloadEmitSource.LocalInserted,
    )

    await context.sync()

    const originalSyncTime = application.payloadManager.findOne(randomItemsKey.uuid).lastSyncEnd.getTime()

    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    const errored = await application.protocolService.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })

    await application.payloadManager.emitPayload(errored, PayloadEmitSource.LocalInserted)

    const recoveryPromise = context.resolveWhenKeyRecovered(errored.uuid)

    await context.sync()

    await recoveryPromise

    expect(application.payloadManager.findOne(errored.uuid).lastSyncEnd.getTime()).to.be.above(originalSyncTime)

    await context.deinit()
  })

  it('recovered keys with key params not matching servers should not be synced if local root key does not match server', async function () {
    /**
     * Assume Application A has been through these states:
     * 1. Registration + Items Key A + Root Key A
     * 2. Password change + Items Key B + Root Key B
     * 3. Password change + Items Key C + Root Key C + Failure to correctly re-encrypt Items Key A and B with Root Key C
     *
     * Application B is not correctly in sync, and is only at State 1 (Registration + Items Key A)
     *
     * Application B receives Items Key B of Root Key B but for whatever reason ignores Items Key C of Root Key C.
     *
     * When it recovers Items Key B, it should not re-upload it to the server, because Application B's Root Key is not
     * the current account's root key.
     */

    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()
    contextA.preventKeyRecoveryOfKeys()

    const contextB = await Factory.createAppContextWithFakeCrypto('app-b', contextA.email, contextA.password)
    await contextB.launch()
    await contextB.signIn()

    await contextA.changePassword('new-password-1')
    const itemsKeyARootKeyB = contextA.itemsKeys[0]
    const itemsKeyBRootKeyB = contextA.itemsKeys[1]

    contextA.disableSyncingOfItems([itemsKeyARootKeyB.uuid, itemsKeyBRootKeyB.uuid])
    await contextA.changePassword('new-password-2')
    const itemsKeyCRootKeyC = contextA.itemsKeys[2]

    contextB.disableKeyRecoveryServerSignIn()
    contextB.preventKeyRecoveryOfKeys([itemsKeyCRootKeyC.uuid])
    contextB.respondToAccountPasswordChallengeWith('new-password-1')

    const recoveryPromise = Promise.all([
      contextB.resolveWhenKeyRecovered(itemsKeyARootKeyB.uuid),
      contextB.resolveWhenKeyRecovered(itemsKeyBRootKeyB.uuid),
    ])

    const observedDirtyItemUuids = []
    contextB.spyOnChangedItems((changed) => {
      const dirty = changed.filter((i) => i.dirty)
      extendArray(observedDirtyItemUuids, Uuids(dirty))
    })

    await contextB.sync()
    await recoveryPromise

    expect(observedDirtyItemUuids.includes(itemsKeyARootKeyB.uuid)).to.equal(false)
    expect(observedDirtyItemUuids.includes(itemsKeyBRootKeyB.uuid)).to.equal(false)

    await contextA.deinit()
    await contextB.deinit()
  })

  it('when encountering many undecryptable items key with same key params, should only prompt once', async function () {
    const namespace = Factory.randomString()
    const unassociatedPassword = 'randfoo'
    const unassociatedIdentifier = 'foorand'
    let totalPromptCount = 0

    const context = await Factory.createAppContextWithFakeCrypto(namespace)
    const application = context.application
    const receiveChallenge = (challenge) => {
      totalPromptCount++
      /** Give unassociated password when prompted */
      application.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], unassociatedPassword)])
    }
    await application.prepareForLaunch({ receiveChallenge })
    await application.launch(true)

    await Factory.registerUserToApplication({
      application: application,
      email: context.email,
      password: context.password,
    })

    /** Create items key associated with a random root key */
    const randomRootKey = await application.protocolService.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )
    const randomItemsKey = await application.protocolService.operatorManager.defaultOperator().createItemsKey()
    const randomItemsKey2 = await application.protocolService.operatorManager.defaultOperator().createItemsKey()

    const encrypted = await application.protocolService.encryptSplit({
      usesRootKey: {
        items: [randomItemsKey.payload, randomItemsKey2.payload],
        key: randomRootKey,
      },
    })

    /** Attempt decryption and insert into rotation in errored state  */
    const decrypted = await application.protocolService.decryptSplit({
      usesRootKeyWithKeyLookup: {
        items: encrypted,
      },
    })

    await application.payloadManager.emitPayloads(decrypted, PayloadEmitSource.LocalInserted)

    /** Wait and allow recovery wizard to complete */
    await Factory.sleep(1.5)

    /** Should be decrypted now */
    expect(application.items.findItem(randomItemsKey.uuid).errorDecrypting).not.be.ok
    expect(application.items.findItem(randomItemsKey2.uuid).errorDecrypting).not.be.ok

    expect(totalPromptCount).to.equal(1)

    expect(application.syncService.isOutOfSync()).to.equal(false)
    await context.deinit()
  })

  it('when changing password on client B, client A should perform recovery flow', async function () {
    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()
    const originalItemsKey = contextA.application.items.getDisplayableItemsKeys()[0]

    const contextB = await Factory.createAppContextWithFakeCrypto(
      'another-namespace',
      contextA.email,
      contextA.password,
    )

    contextB.ignoreChallenges()
    await contextB.launch()
    await contextB.signIn()

    const newPassword = `${Math.random()}`

    const result = await contextB.application.changePassword(contextA.password, newPassword)

    expect(result.error).to.not.be.ok
    expect(contextB.application.items.getAnyItems(ContentType.ItemsKey).length).to.equal(2)

    const newItemsKey = contextB.application.items.getDisplayableItemsKeys().find((k) => k.uuid !== originalItemsKey.uuid)

    const note = await Factory.createSyncedNote(contextB.application)

    const recoveryPromise = contextA.resolveWhenKeyRecovered(newItemsKey.uuid)

    contextA.password = newPassword

    await contextA.sync(syncOptions)
    await recoveryPromise

    /** Same previously errored key should now no longer be errored, */
    expect(contextA.application.items.getAnyItems(ContentType.ItemsKey).length).to.equal(2)
    for (const key of contextA.application.itemManager.getDisplayableItemsKeys()) {
      expect(key.errorDecrypting).to.not.be.ok
    }

    const aKey = await contextA.application.protocolService.getRootKey()
    const bKey = await contextB.application.protocolService.getRootKey()
    expect(aKey.compare(bKey)).to.equal(true)

    expect(contextA.application.items.findItem(note.uuid).errorDecrypting).to.not.be.ok
    expect(contextB.application.items.findItem(note.uuid).errorDecrypting).to.not.be.ok

    expect(contextA.application.syncService.isOutOfSync()).to.equal(false)
    expect(contextB.application.syncService.isOutOfSync()).to.equal(false)

    await contextA.deinit()
    await contextB.deinit()
  }).timeout(80000)

  it('when items key associated with item is errored, item should be marked waiting for key', async function () {
    const namespace = Factory.randomString()
    const newPassword = `${Math.random()}`
    const contextA = await Factory.createAppContextWithFakeCrypto(namespace)
    const appA = contextA.application
    await appA.prepareForLaunch({ receiveChallenge: () => {} })
    await appA.launch(true)

    await Factory.registerUserToApplication({
      application: appA,
      email: contextA.email,
      password: contextA.password,
    })

    expect(appA.items.getItems(ContentType.ItemsKey).length).to.equal(1)

    /** Create simultaneous appB signed into same account */
    const appB = await Factory.createApplicationWithFakeCrypto('another-namespace')
    await appB.prepareForLaunch({ receiveChallenge: () => {} })
    await appB.launch(true)

    await Factory.loginToApplication({
      application: appB,
      email: contextA.email,
      password: contextA.password,
    })

    /** Change password on appB */
    await appB.changePassword(contextA.password, newPassword)
    const note = await Factory.createSyncedNote(appB)
    await appB.sync.sync()

    /** We expect the item in appA to be errored at this point, but we do not want it to recover */
    await appA.sync.sync()
    expect(appA.payloadManager.findOne(note.uuid).waitingForKey).to.equal(true)

    console.warn('Expecting exceptions below as we destroy app during key recovery')
    await Factory.safeDeinit(appA)
    await Factory.safeDeinit(appB)

    const recreatedAppA = await Factory.createApplicationWithFakeCrypto(namespace)
    await recreatedAppA.prepareForLaunch({ receiveChallenge: () => {} })
    await recreatedAppA.launch(true)

    expect(recreatedAppA.payloadManager.findOne(note.uuid).errorDecrypting).to.equal(true)
    expect(recreatedAppA.payloadManager.findOne(note.uuid).waitingForKey).to.equal(true)
    await Factory.safeDeinit(recreatedAppA)
  })

  it('when client key params differ from server, and no matching items key exists to compare against, should perform sign in flow', async function () {
    /**
     * When a user changes password/email on client A, client B must update their root key to the new one.
     * To do this, we can potentially avoid making a new sign in request (and creating a new session) by instead
     * reading one of the undecryptable items key (which is potentially the new one that client A created). If the keyParams
     * of that items key matches the servers, it means we can use those key params to compute our new local root key,
     * instead of having to sign in.
     */
    const unassociatedPassword = 'randfoo'
    const context = await Factory.createAppContextWithFakeCrypto('some-namespace')
    const application = context.application

    const receiveChallenge = (challenge) => {
      const isKeyRecoveryPrompt = challenge.subheading?.includes(KeyRecoveryStrings.KeyRecoveryPasswordRequired)
      application.submitValuesForChallenge(challenge, [
        CreateChallengeValue(challenge.prompts[0], isKeyRecoveryPrompt ? unassociatedPassword : context.password),
      ])
    }

    await application.prepareForLaunch({ receiveChallenge })
    await application.launch(true)
    await context.register()

    const correctRootKey = await application.protocolService.getRootKey()

    /**
     * 1. Change our root key locally so that its keys params doesn't match the server's
     * 2. Create an items key payload that is set to errorDecrypting, and which is encrypted
     *    with the incorrect root key, so that it cannot be used to validate the user's password
     */

    const unassociatedIdentifier = 'foorand'

    /** Create items key associated with a random root key */
    const randomRootKey = await application.protocolService.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )

    const signInFunction = sinon.spy(application.keyRecoveryService, 'performServerSignIn')

    await application.protocolService.setRootKey(randomRootKey)

    const correctItemsKey = await application.protocolService.operatorManager.defaultOperator().createItemsKey()

    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [correctItemsKey.payload],
        key: randomRootKey,
      },
    })

    const resolvePromise = Promise.all([
      context.awaitSignInEvent(),
      context.resolveWhenKeyRecovered(correctItemsKey.uuid),
    ])

    await application.payloadManager.emitPayload(
      encrypted.copy({
        errorDecrypting: true,
        dirty: true,
      }),
      PayloadEmitSource.LocalInserted,
    )

    await context.sync()

    await resolvePromise

    expect(signInFunction.callCount).to.equal(1)

    const clientRootKey = await application.protocolService.getRootKey()
    expect(clientRootKey.compare(correctRootKey)).to.equal(true)

    const decryptedKey = application.items.findItem(correctItemsKey.uuid)
    expect(decryptedKey).to.be.ok
    expect(decryptedKey.content.itemsKey).to.equal(correctItemsKey.content.itemsKey)

    expect(application.syncService.isOutOfSync()).to.equal(false)
    await context.deinit()
  })

  it(`when encountering an items key that cannot be decrypted for which we already have a decrypted value,
          it should be emitted as ignored`, async function () {
    const context = await Factory.createAppContextWithFakeCrypto()
    const application = context.application
    await context.launch()
    await context.register()

    /** Create and emit errored encrypted items key payload */
    const itemsKey = await application.protocolService.getSureDefaultItemsKey()
    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    const newUpdated = new Date()
    const errored = encrypted.copy({
      content: '004:...',
      errorDecrypting: true,
      updated_at: newUpdated,
    })

    await context.receiveServerResponse({ retrievedItems: [errored.ejected()] })

    /** Our current items key should not be overwritten */
    const currentItemsKey = application.items.findItem(itemsKey.uuid)
    expect(currentItemsKey.errorDecrypting).to.not.be.ok
    expect(currentItemsKey.itemsKey).to.equal(itemsKey.itemsKey)

    /** The timestamp of our current key should be updated however so we do not enter out of sync state */
    expect(currentItemsKey.serverUpdatedAt.getTime()).to.equal(newUpdated.getTime())

    expect(application.syncService.isOutOfSync()).to.equal(false)

    await context.deinit()
  })

  it(`ignored key payloads should be added to undecryptables and recovered`, async function () {
    const context = await Factory.createAppContextWithFakeCrypto()
    const application = context.application
    await context.launch()
    await context.register()

    const itemsKey = await application.protocolService.getSureDefaultItemsKey()
    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    const newUpdated = new Date()
    const errored = encrypted.copy({
      errorDecrypting: true,
      updated_at: newUpdated,
    })

    await application.payloadManager.emitDeltaEmit({
      emits: [],
      ignored: [errored],
      source: PayloadEmitSource.RemoteRetrieved,
    })

    await context.resolveWhenKeyRecovered(itemsKey.uuid)

    const latestItemsKey = application.items.findItem(itemsKey.uuid)

    expect(latestItemsKey.errorDecrypting).to.not.be.ok
    expect(latestItemsKey.itemsKey).to.equal(itemsKey.itemsKey)
    expect(latestItemsKey.serverUpdatedAt.getTime()).to.equal(newUpdated.getTime())
    expect(application.syncService.isOutOfSync()).to.equal(false)

    await context.deinit()
  })

  it('application should prompt to recover undecryptables on launch', async function () {
    const namespace = Factory.randomString()
    const context = await Factory.createAppContextWithFakeCrypto(namespace)
    const application = context.application
    await context.launch()
    await context.register()

    /** Create and emit errored encrypted items key payload */
    const itemsKey = await application.protocolService.getSureDefaultItemsKey()
    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    context.disableKeyRecovery()

    await application.payloadManager.emitDeltaEmit({
      emits: [],
      ignored: [
        encrypted.copy({
          errorDecrypting: true,
        }),
      ],
      source: PayloadEmitSource.RemoteRetrieved,
    })

    /** Allow enough time to persist to disk, but not enough to complete recovery wizard */
    console.warn('Expecting some error below because we are destroying app in the middle of processing.')

    await Factory.sleep(0.1)

    expect(application.syncService.isOutOfSync()).to.equal(false)

    await context.deinit()

    const recreatedContext = await Factory.createAppContextWithFakeCrypto(namespace, context.email, context.password)

    const recreatedApp = recreatedContext.application

    const promise = recreatedContext.resolveWhenKeyRecovered(itemsKey.uuid)

    await recreatedContext.launch()

    await promise

    await Factory.safeDeinit(recreatedApp)
  })

  it('when encountering an undecryptable 003 items key, should recover through recovery wizard', async function () {
    const namespace = Factory.randomString()
    const unassociatedPassword = 'randfoo'
    const unassociatedIdentifier = 'foorand'

    const context = await Factory.createAppContextWithFakeCrypto(namespace)
    const application = context.application
    const receiveChallenge = (challenge) => {
      /** Give unassociated password when prompted */
      application.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], unassociatedPassword)])
    }
    await application.prepareForLaunch({ receiveChallenge })
    await application.launch(true)

    await Factory.registerOldUser({
      application: application,
      email: context.email,
      password: context.password,
      version: ProtocolVersion.V003,
    })

    /** Create items key associated with a random root key */
    const randomRootKey = await application.protocolService.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
      ProtocolVersion.V003,
    )
    const randomItemsKey = await application.protocolService.operatorManager
      .operatorForVersion(ProtocolVersion.V003)
      .createItemsKey()

    const encrypted = await application.protocolService.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    /** Attempt decryption and insert into rotation in errored state  */
    const decrypted = await application.protocolService.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })
    /** Expect to be errored */
    expect(decrypted.errorDecrypting).to.equal(true)

    /** Insert into rotation */
    await application.payloadManager.emitPayload(decrypted, PayloadEmitSource.LocalInserted)

    /** Wait and allow recovery wizard to complete */
    await Factory.sleep(0.3)

    /** Should be decrypted now */
    expect(application.items.findItem(encrypted.uuid).errorDecrypting).to.not.be.ok

    expect(application.syncService.isOutOfSync()).to.equal(false)
    await context.deinit()
  })

  it('when replacing root key, new root key should be set before items key are re-saved to disk', async function () {
    const contextA = await Factory.createAppContextWithFakeCrypto()
    await contextA.launch()
    await contextA.register()

    const newPassword = 'new-password'

    /** Create simultaneous appB signed into same account */
    const contextB = await Factory.createAppContextWithFakeCrypto(
      'another-namespace',
      contextA.email,
      contextA.password,
    )

    contextB.ignoreChallenges()
    await contextB.launch()
    await contextB.signIn()
    const appB = contextB.application

    /** Change password on appB */
    const result = await appB.changePassword(contextA.password, newPassword)
    expect(result.error).to.not.be.ok
    contextA.password = newPassword
    await appB.sync.sync()

    const newDefaultKey = appB.protocolService.getSureDefaultItemsKey()

    const encrypted = await appB.protocolService.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [newDefaultKey.payload],
      },
    })

    /** Insert foreign items key into appA, which shouldn't be able to decrypt it yet */
    const appA = contextA.application
    await appA.payloadManager.emitPayload(
      encrypted.copy({
        errorDecrypting: true,
      }),
      PayloadEmitSource.LocalInserted,
    )

    await Factory.awaitFunctionInvokation(appA.keyRecoveryService, 'handleDecryptionOfAllKeysMatchingCorrectRootKey')

    /** Stored version of items key should use new root key */
    const stored = (await appA.deviceInterface.getAllRawDatabasePayloads(appA.identifier)).find(
      (payload) => payload.uuid === newDefaultKey.uuid,
    )
    const storedParams = await appA.protocolService.getKeyEmbeddedKeyParams(new EncryptedPayload(stored))

    const correctStored = (await appB.deviceInterface.getAllRawDatabasePayloads(appB.identifier)).find(
      (payload) => payload.uuid === newDefaultKey.uuid,
    )

    const correctParams = await appB.protocolService.getKeyEmbeddedKeyParams(new EncryptedPayload(correctStored))

    expect(storedParams).to.eql(correctParams)

    await contextA.deinit()
    await contextB.deinit()
  }).timeout(80000)
})
