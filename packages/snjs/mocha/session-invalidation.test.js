import * as Factory from './lib/factory.js'

describe.skip('session invalidation tests to revisit', function () {
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
    expect(contextB.application.items.getAnyItems(ContentType.TYPES.ItemsKey).length).to.equal(2)

    const newItemsKey = contextB.application.items
      .getDisplayableItemsKeys()
      .find((k) => k.uuid !== originalItemsKey.uuid)

    const note = await Factory.createSyncedNote(contextB.application)

    const recoveryPromise = contextA.resolveWhenKeyRecovered(newItemsKey.uuid)

    contextA.password = newPassword

    await contextA.sync(syncOptions)
    await recoveryPromise

    /** Same previously errored key should now no longer be errored, */
    expect(contextA.application.items.getAnyItems(ContentType.TYPES.ItemsKey).length).to.equal(2)
    for (const key of contextA.application.items.getDisplayableItemsKeys()) {
      expect(key.errorDecrypting).to.not.be.ok
    }

    const aKey = await contextA.application.encryption.getRootKey()
    const bKey = await contextB.application.encryption.getRootKey()
    expect(aKey.compare(bKey)).to.equal(true)

    expect(contextA.application.items.findItem(note.uuid).errorDecrypting).to.not.be.ok
    expect(contextB.application.items.findItem(note.uuid).errorDecrypting).to.not.be.ok

    expect(contextA.application.sync.isOutOfSync()).to.equal(false)
    expect(contextB.application.sync.isOutOfSync()).to.equal(false)

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

    expect(appA.items.getItems(ContentType.TYPES.ItemsKey).length).to.equal(1)

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
    expect(appA.payloads.findOne(note.uuid).waitingForKey).to.equal(true)

    console.warn('Expecting exceptions below as we destroy app during key recovery')
    await Factory.safeDeinit(appA)
    await Factory.safeDeinit(appB)

    const recreatedAppA = await Factory.createApplicationWithFakeCrypto(namespace)
    await recreatedAppA.prepareForLaunch({ receiveChallenge: () => {} })
    await recreatedAppA.launch(true)

    expect(recreatedAppA.payloads.findOne(note.uuid).errorDecrypting).to.equal(true)
    expect(recreatedAppA.payloads.findOne(note.uuid).waitingForKey).to.equal(true)
    await Factory.safeDeinit(recreatedAppA)
  })

  it('errored second client should not upload its items keys', async function () {
    /**
     * The original source of this issue was that when changing password on client A and syncing with B,
     * the newly encrypted items key retrieved on B would be included as "ignored", so its timestamps
     * would not be emitted, and thus the application would be in sync. The app would then download
     * the items key independently, and make duplicates erroneously.
     */
    const contextA = this.context

    const email = Utils.generateUuid()
    const password = Utils.generateUuid()
    await Factory.registerUserToApplication({
      application: contextA.application,
      email,
      password: password,
    })

    const contextB = await Factory.createAppContext({ email, password })
    await contextB.launch()
    await contextB.signIn()

    contextA.ignoreChallenges()
    contextB.ignoreChallenges()

    const newPassword = Utils.generateUuid()

    await contextA.application.user.changeCredentials({
      currentPassword: password,
      newPassword: newPassword,
      origination: KeyParamsOrigination.PasswordChange,
    })

    await contextB.syncWithIntegrityCheck()
    await contextA.syncWithIntegrityCheck()

    const clientAUndecryptables = contextA.keyRecovery.getUndecryptables()
    const clientBUndecryptables = contextB.keyRecovery.getUndecryptables()

    expect(Object.keys(clientBUndecryptables).length).to.equal(1)
    expect(Object.keys(clientAUndecryptables).length).to.equal(0)

    await contextB.deinit()
  })

  it('changing password on one client should not invalidate other sessions', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })

    const appA = await Factory.createApplicationWithFakeCrypto(Factory.randomString())
    await appA.prepareForLaunch({})
    await appA.launch(true)

    const email = `${Math.random()}`
    const password = `${Math.random()}`

    await Factory.registerUserToApplication({
      application: appA,
      email: email,
      password: password,
    })

    /** Create simultaneous appB signed into same account */
    const appB = await Factory.createApplicationWithFakeCrypto('another-namespace')
    await appB.prepareForLaunch({})
    await appB.launch(true)
    await Factory.loginToApplication({
      application: appB,
      email: email,
      password: password,
    })

    /** Change password on appB */
    const newPassword = 'random'
    await appB.changePassword(password, newPassword)

    /** Create an item and sync it */
    const note = await Factory.createSyncedNote(appB)

    /** Expect appA session to still be valid */
    await appA.sync.sync()
    expect(appA.items.findItem(note.uuid)).to.be.ok

    await Factory.safeDeinit(appA)
    await Factory.safeDeinit(appB)
  })
})
