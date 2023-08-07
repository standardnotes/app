import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('key recovery service', function () {
  this.timeout(Factory.TwentySecondTimeout)

  beforeEach(function () {
    localStorage.clear()
  })

  afterEach(function () {
    localStorage.clear()
    sinon.restore()
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

    const randomRootKey = await application.encryption.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )
    const randomItemsKey = await context.operators.defaultOperator().createItemsKey()

    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    const errored = await application.encryption.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })

    expect(errored.errorDecrypting).to.equal(true)

    await application.payloads.emitPayload(errored, PayloadEmitSource.LocalInserted)

    await context.resolveWhenKeyRecovered(errored.uuid)

    expect(application.items.findItem(errored.uuid).errorDecrypting).to.not.be.ok

    expect(application.sync.isOutOfSync()).to.equal(false)
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

    const randomRootKey = await application.encryption.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )

    const randomItemsKey = await context.operators.defaultOperator().createItemsKey()

    await application.payloads.emitPayload(
      randomItemsKey.payload.copy({ dirty: true, dirtyIndex: getIncrementedDirtyIndex() }),
      PayloadEmitSource.LocalInserted,
    )

    await context.sync()

    const originalSyncTime = application.payloads.findOne(randomItemsKey.uuid).lastSyncEnd.getTime()

    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    const errored = await application.encryption.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })

    await application.payloads.emitPayload(errored, PayloadEmitSource.LocalInserted)

    const recoveryPromise = context.resolveWhenKeyRecovered(errored.uuid)

    await context.sync()

    await recoveryPromise

    expect(application.payloads.findOne(errored.uuid).lastSyncEnd.getTime()).to.be.above(originalSyncTime)

    await context.deinit()
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
      application.submitValuesForChallenge(challenge, [
        CreateChallengeValue(challenge.prompts[0], unassociatedPassword),
      ])
    }
    await application.prepareForLaunch({ receiveChallenge })
    await application.launch(true)

    await Factory.registerUserToApplication({
      application: application,
      email: context.email,
      password: context.password,
    })

    /** Create items key associated with a random root key */
    const randomRootKey = await application.encryption.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )
    const randomItemsKey = await context.operators.defaultOperator().createItemsKey()
    const randomItemsKey2 = await context.operators.defaultOperator().createItemsKey()

    const encrypted = await application.encryption.encryptSplit({
      usesRootKey: {
        items: [randomItemsKey.payload, randomItemsKey2.payload],
        key: randomRootKey,
      },
    })

    /** Attempt decryption and insert into rotation in errored state  */
    const decrypted = await application.encryption.decryptSplit({
      usesRootKeyWithKeyLookup: {
        items: encrypted,
      },
    })

    await application.payloads.emitPayloads(decrypted, PayloadEmitSource.LocalInserted)

    /** Wait and allow recovery wizard to complete */
    await Factory.sleep(1.5)

    /** Should be decrypted now */
    expect(application.items.findItem(randomItemsKey.uuid).errorDecrypting).not.be.ok
    expect(application.items.findItem(randomItemsKey2.uuid).errorDecrypting).not.be.ok

    expect(totalPromptCount).to.equal(1)

    expect(application.sync.isOutOfSync()).to.equal(false)
    await context.deinit()
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

    const correctRootKey = await application.encryption.getRootKey()

    /**
     * 1. Change our root key locally so that its keys params doesn't match the server's
     * 2. Create an items key payload that is set to errorDecrypting, and which is encrypted
     *    with the incorrect root key, so that it cannot be used to validate the user's password
     */

    const unassociatedIdentifier = 'foorand'

    /** Create items key associated with a random root key */
    const randomRootKey = await application.encryption.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
    )

    const signInFunction = sinon.spy(context.keyRecovery, 'performServerSignIn')

    await application.encryption.setRootKey(randomRootKey)

    const correctItemsKey = await context.operators.defaultOperator().createItemsKey()

    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKey: {
        items: [correctItemsKey.payload],
        key: randomRootKey,
      },
    })

    const resolvePromise = Promise.all([
      context.awaitSignInEvent(),
      context.resolveWhenKeyRecovered(correctItemsKey.uuid),
    ])

    await application.payloads.emitPayload(
      encrypted.copy({
        errorDecrypting: true,
        dirty: true,
      }),
      PayloadEmitSource.LocalInserted,
    )

    await context.sync()

    await resolvePromise

    expect(signInFunction.callCount).to.equal(1)

    const clientRootKey = await application.encryption.getRootKey()
    expect(clientRootKey.compare(correctRootKey)).to.equal(true)

    const decryptedKey = application.items.findItem(correctItemsKey.uuid)
    expect(decryptedKey).to.be.ok
    expect(decryptedKey.content.itemsKey).to.equal(correctItemsKey.content.itemsKey)

    expect(application.sync.isOutOfSync()).to.equal(false)

    await context.deinit()
  })

  it(`when encountering an items key that cannot be decrypted for which we already have a decrypted value,
          it should be emitted as ignored`, async function () {
    const context = await Factory.createAppContextWithFakeCrypto()
    const application = context.application
    await context.launch()
    await context.register()

    /** Create and emit errored encrypted items key payload */
    const itemsKey = await application.encryption.getSureDefaultItemsKey()
    const encrypted = await application.encryption.encryptSplitSingle({
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

    context.disableKeyRecovery()

    await context.receiveServerResponse({ retrievedItems: [errored.ejected()] })

    /** Our current items key should not be overwritten */
    const currentItemsKey = application.items.findItem(itemsKey.uuid)
    expect(currentItemsKey.errorDecrypting).to.not.be.ok
    expect(currentItemsKey.itemsKey).to.equal(itemsKey.itemsKey)

    /** The timestamp of our current key should be updated however so we do not enter out of sync state */
    expect(currentItemsKey.serverUpdatedAt.getTime()).to.equal(newUpdated.getTime())

    expect(application.sync.isOutOfSync()).to.equal(false)

    await context.deinit()
  })

  it(`ignored key payloads should be added to undecryptables and recovered`, async function () {
    const context = await Factory.createAppContextWithFakeCrypto()
    const application = context.application
    await context.launch()
    await context.register()

    const itemsKey = await application.encryption.getSureDefaultItemsKey()
    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    const newUpdated = new Date()
    const errored = encrypted.copy({
      errorDecrypting: true,
      updated_at: newUpdated,
    })

    await application.payloads.emitDeltaEmit({
      emits: [],
      ignored: [errored],
      source: PayloadEmitSource.RemoteRetrieved,
    })

    await context.resolveWhenKeyRecovered(itemsKey.uuid)

    const latestItemsKey = application.items.findItem(itemsKey.uuid)

    expect(latestItemsKey.errorDecrypting).to.not.be.ok
    expect(latestItemsKey.itemsKey).to.equal(itemsKey.itemsKey)
    expect(latestItemsKey.serverUpdatedAt.getTime()).to.equal(newUpdated.getTime())
    expect(application.sync.isOutOfSync()).to.equal(false)

    await context.deinit()
  })

  it('application should prompt to recover undecryptables on launch', async function () {
    const namespace = Factory.randomString()
    const context = await Factory.createAppContextWithFakeCrypto(namespace)
    const application = context.application
    await context.launch()
    await context.register()

    /** Create and emit errored encrypted items key payload */
    const itemsKey = await application.encryption.getSureDefaultItemsKey()
    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [itemsKey.payload],
      },
    })

    context.disableKeyRecovery()

    await application.payloads.emitDeltaEmit({
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

    expect(application.sync.isOutOfSync()).to.equal(false)

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
      application.submitValuesForChallenge(challenge, [
        CreateChallengeValue(challenge.prompts[0], unassociatedPassword),
      ])
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
    const randomRootKey = await application.encryption.createRootKey(
      unassociatedIdentifier,
      unassociatedPassword,
      KeyParamsOrigination.Registration,
      ProtocolVersion.V003,
    )
    const randomItemsKey = await context.operators.operatorForVersion(ProtocolVersion.V003).createItemsKey()

    const encrypted = await application.encryption.encryptSplitSingle({
      usesRootKey: {
        items: [randomItemsKey.payload],
        key: randomRootKey,
      },
    })

    /** Attempt decryption and insert into rotation in errored state  */
    const decrypted = await application.encryption.decryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [encrypted],
      },
    })
    /** Expect to be errored */
    expect(decrypted.errorDecrypting).to.equal(true)

    /** Insert into rotation */
    await application.payloads.emitPayload(decrypted, PayloadEmitSource.LocalInserted)

    /** Wait and allow recovery wizard to complete */
    await Factory.sleep(0.3)

    /** Should be decrypted now */
    expect(application.items.findItem(encrypted.uuid).errorDecrypting).to.not.be.ok

    expect(application.sync.isOutOfSync()).to.equal(false)
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

    const newDefaultKey = appB.encryption.getSureDefaultItemsKey()

    const encrypted = await appB.encryption.encryptSplitSingle({
      usesRootKeyWithKeyLookup: {
        items: [newDefaultKey.payload],
      },
    })

    /** Insert foreign items key into appA, which shouldn't be able to decrypt it yet */
    const appA = contextA.application
    await appA.payloads.emitPayload(
      encrypted.copy({
        errorDecrypting: true,
      }),
      PayloadEmitSource.LocalInserted,
    )

    await Factory.awaitFunctionInvokation(contextA.keyRecovery, 'handleDecryptionOfAllKeysMatchingCorrectRootKey')

    /** Stored version of items key should use new root key */
    const stored = (await appA.device.getAllDatabaseEntries(appA.identifier)).find(
      (payload) => payload.uuid === newDefaultKey.uuid,
    )
    const storedParams = await appA.encryption.getKeyEmbeddedKeyParamsFromItemsKey(new EncryptedPayload(stored))

    const correctStored = (await appB.device.getAllDatabaseEntries(appB.identifier)).find(
      (payload) => payload.uuid === newDefaultKey.uuid,
    )

    const correctParams = await appB.encryption.getKeyEmbeddedKeyParamsFromItemsKey(new EncryptedPayload(correctStored))

    expect(storedParams).to.eql(correctParams)

    await contextA.deinit()
    await contextB.deinit()
  }).timeout(80000)
})
