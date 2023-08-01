/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
import * as Utils from './lib/Utils.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('keys', function () {
  this.timeout(Factory.TwentySecondTimeout)

  beforeEach(async function () {
    localStorage.clear()

    this.context = await Factory.createAppContext()
    await this.context.launch()

    this.application = this.context.application
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    if (!this.application.dealloced) {
      await Factory.safeDeinit(this.application)
    }

    this.application = undefined
    localStorage.clear()
  })

  it('should not have root key by default', async function () {
    expect(await this.application.encryption.getRootKey()).to.not.be.ok
  })

  it('validates content types requiring root encryption', function () {
    expect(ContentTypeUsesRootKeyEncryption(ContentType.TYPES.ItemsKey)).to.equal(true)
    expect(ContentTypeUsesRootKeyEncryption(ContentType.TYPES.EncryptedStorage)).to.equal(true)
    expect(ContentTypeUsesRootKeyEncryption(ContentType.TYPES.Item)).to.equal(false)
    expect(ContentTypeUsesRootKeyEncryption(ContentType.TYPES.Note)).to.equal(false)
  })

  it('generating export params with no account or passcode should produce encrypted payload', async function () {
    /** Items key available by default */
    const payload = Factory.createNotePayload()
    const processedPayload = CreateEncryptedLocalStorageContextPayload(
      await this.application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(isEncryptedPayload(processedPayload)).to.equal(true)
  })

  it('has root key and one items key after registering user', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    expect(this.application.encryption.getRootKey()).to.be.ok
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
  })

  it('changing root key with passcode should re-wrap root key', async function () {
    const email = 'foo'
    const password = 'bar'
    const key = await this.application.encryption.createRootKey(email, password, KeyParamsOrigination.Registration)
    await this.application.encryption.setRootKey(key)
    Factory.handlePasswordChallenges(this.application, password)
    await this.application.addPasscode(password)

    /** We should be able to decrypt wrapped root key with passcode */
    const wrappingKeyParams = await this.application.encryption.rootKeyManager.getRootKeyWrapperKeyParams()
    const wrappingKey = await this.application.encryption.computeRootKey(password, wrappingKeyParams)
    await this.application.encryption.unwrapRootKey(wrappingKey).catch((error) => {
      expect(error).to.not.be.ok
    })

    const newPassword = 'bar'
    const newKey = await this.application.encryption.createRootKey(
      email,
      newPassword,
      KeyParamsOrigination.Registration,
    )
    await this.application.encryption.setRootKey(newKey, wrappingKey)
    await this.application.encryption.unwrapRootKey(wrappingKey).catch((error) => {
      expect(error).to.not.be.ok
    })
  })

  it('items key should be encrypted with root key', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const itemsKey = await this.application.encryption.getSureDefaultItemsKey()
    const rootKey = await this.application.encryption.getRootKey()

    /** Encrypt items key */
    const encryptedPayload = await this.application.encryption.encryptSplitSingle({
      usesRootKey: {
        items: [itemsKey.payloadRepresentation()],
        key: rootKey,
      },
    })

    /** Should not have an items_key_id */
    expect(encryptedPayload.items_key_id).to.not.be.ok

    /** Attempt to decrypt with root key. Should succeed. */
    const decryptedPayload = await this.application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [encryptedPayload],
        key: rootKey,
      },
    })

    expect(decryptedPayload.errorDecrypting).to.not.be.ok
    expect(decryptedPayload.content.itemsKey).to.equal(itemsKey.content.itemsKey)
  })

  it('should create random items key if no account and no passcode', async function () {
    const itemsKeys = this.application.items.getDisplayableItemsKeys()
    expect(itemsKeys.length).to.equal(1)
    const notePayload = Factory.createNotePayload()

    const dirtied = notePayload.copy({
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
    })
    await this.application.payloads.emitPayload(dirtied, PayloadEmitSource.LocalChanged)
    await this.application.sync.sync()

    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const rawNotePayload = rawPayloads.find((r) => r.content_type === ContentType.TYPES.Note)
    expect(typeof rawNotePayload.content).to.equal('string')
  })

  it('should keep offline created items key upon registration', async function () {
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    const originalItemsKey = this.application.items.getDisplayableItemsKeys()[0]
    await this.application.register(this.email, this.password)

    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    const newestItemsKey = this.application.items.getDisplayableItemsKeys()[0]
    expect(newestItemsKey.uuid).to.equal(originalItemsKey.uuid)
  })

  it('should use items key for encryption of note', async function () {
    const notePayload = Factory.createNotePayload()
    const keyToUse = await this.application.encryption.itemsEncryption.keyToUseForItemEncryption(notePayload)
    expect(keyToUse.content_type).to.equal(ContentType.TYPES.ItemsKey)
  })

  it('encrypting an item should associate an items key to it', async function () {
    const note = Factory.createNotePayload()
    const encryptedPayload = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note],
      },
    })

    const itemsKey = this.application.encryption.itemsKeyForEncryptedPayload(encryptedPayload)
    expect(itemsKey).to.be.ok
  })

  it('decrypt encrypted item with associated key', async function () {
    const note = Factory.createNotePayload()
    const title = note.content.title
    const encryptedPayload = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note],
      },
    })

    const itemsKey = this.application.encryption.itemsKeyForEncryptedPayload(encryptedPayload)
    expect(itemsKey).to.be.ok

    const decryptedPayload = await this.application.encryption.decryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [encryptedPayload],
      },
    })

    expect(decryptedPayload.content.title).to.equal(title)
  })

  it('decrypts items waiting for keys', async function () {
    const notePayload = Factory.createNotePayload()
    const title = notePayload.content.title
    const encryptedPayload = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [notePayload],
      },
    })

    const itemsKey = this.application.encryption.itemsKeyForEncryptedPayload(encryptedPayload)

    await this.application.items.removeItemFromMemory(itemsKey)

    const erroredPayload = await this.application.encryption.decryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [encryptedPayload],
      },
    })

    await this.application.mutator.emitItemsFromPayloads([erroredPayload], PayloadEmitSource.LocalChanged)

    const note = this.application.items.findAnyItem(notePayload.uuid)
    expect(note.errorDecrypting).to.equal(true)
    expect(note.waitingForKey).to.equal(true)

    const keyPayload = new DecryptedPayload(itemsKey.payload.ejected())
    await this.application.mutator.emitItemsFromPayloads([keyPayload], PayloadEmitSource.LocalChanged)

    /**
     * Sleeping is required to trigger asyncronous encryptionService.decryptItemsWaitingForKeys,
     * which occurs after keys are mapped above.
     */
    await Factory.sleep(0.2)

    const updatedNote = this.application.items.findItem(note.uuid)

    expect(updatedNote.errorDecrypting).to.not.be.ok
    expect(updatedNote.waitingForKey).to.not.be.ok
    expect(updatedNote.content.title).to.equal(title)
  })

  it('attempting to emit errored items key for which there exists a non errored master copy should ignore it', async function () {
    await Factory.registerUserToApplication({ application: this.application })

    const itemsKey = await this.application.encryption.getSureDefaultItemsKey()

    expect(itemsKey.errorDecrypting).to.not.be.ok

    const errored = new EncryptedPayload({
      ...itemsKey.payload,
      content: '004:...',
      errorDecrypting: true,
    })

    const response = new ServerSyncResponse({
      data: {
        retrieved_items: [errored.ejected()],
      },
    })

    await this.application.sync.handleSuccessServerResponse({ payloadsSavedOrSaving: [], options: {} }, response)

    const refreshedKey = this.application.payloads.findOne(itemsKey.uuid)

    expect(refreshedKey.errorDecrypting).to.not.be.ok
    expect(refreshedKey.content.itemsKey).to.be.ok
  })

  it('generating export params with logged in account should produce encrypted payload', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const payload = Factory.createNotePayload()
    const encryptedPayload = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [payload],
      },
    })
    expect(typeof encryptedPayload.content).to.equal('string')
    expect(encryptedPayload.content.substring(0, 3)).to.equal(this.application.encryption.getLatestVersion())
  })

  it('When setting passcode, should encrypt items keys', async function () {
    await this.application.addPasscode('foo')
    const itemsKey = this.application.items.getDisplayableItemsKeys()[0]
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const itemsKeyRawPayload = rawPayloads.find((p) => p.uuid === itemsKey.uuid)
    const itemsKeyPayload = new EncryptedPayload(itemsKeyRawPayload)
    expect(itemsKeyPayload.enc_item_key).to.be.ok
  })

  it('items key encrypted payload should contain root key params', async function () {
    await this.application.addPasscode('foo')
    const itemsKey = this.application.items.getDisplayableItemsKeys()[0]
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const itemsKeyRawPayload = rawPayloads.find((p) => p.uuid === itemsKey.uuid)
    const itemsKeyPayload = new EncryptedPayload(itemsKeyRawPayload)

    const authenticatedData = this.context.encryption.getEmbeddedPayloadAuthenticatedData(itemsKeyPayload)
    const rootKeyParams = await this.application.encryption.getRootKeyParams()

    expect(authenticatedData.kp).to.be.ok
    expect(authenticatedData.kp).to.eql(rootKeyParams.getPortableValue())
    expect(authenticatedData.kp.origination).to.equal(KeyParamsOrigination.PasscodeCreate)
  })

  it('correctly validates local passcode', async function () {
    const passcode = 'foo'
    await this.application.addPasscode('foo')
    expect((await this.application.encryption.validatePasscode('wrong')).valid).to.equal(false)
    expect((await this.application.encryption.validatePasscode(passcode)).valid).to.equal(true)
  })

  it('signing into 003 account should delete latest offline items key and create 003 items key', async function () {
    /**
     * When starting the application it will create an items key with the latest protocol version (004).
     * Upon signing into an 003 account, the application should delete any neverSynced items keys,
     * and create a new default items key that is the default for a given protocol version.
     */
    const defaultItemsKey = await this.application.encryption.getSureDefaultItemsKey()
    const latestVersion = this.application.encryption.getLatestVersion()
    expect(defaultItemsKey.keyVersion).to.equal(latestVersion)

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: ProtocolVersion.V003,
    })

    const itemsKeys = this.application.items.getDisplayableItemsKeys()
    expect(itemsKeys.length).to.equal(1)
    const newestItemsKey = itemsKeys[0]
    expect(newestItemsKey.keyVersion).to.equal(ProtocolVersion.V003)
    const rootKey = await this.application.encryption.getRootKey()
    expect(newestItemsKey.itemsKey).to.equal(rootKey.masterKey)
    expect(newestItemsKey.dataAuthenticationKey).to.equal(rootKey.dataAuthenticationKey)
  })

  it('reencrypts existing notes when logging into an 003 account', async function () {
    await Factory.createManyMappedNotes(this.application, 10)
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: ProtocolVersion.V003,
    })

    expect(this.application.payloads.invalidPayloads.length).to.equal(0)
    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    expect(this.application.items.getDisplayableItemsKeys()[0].dirty).to.equal(false)

    /** Sign out and back in */
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await this.application.signIn(this.email, this.password, undefined, undefined, undefined, true)

    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(1)
    expect(this.application.items.getDisplayableNotes().length).to.equal(10)
    expect(this.application.payloads.invalidPayloads.length).to.equal(0)
  })

  it('When root key changes, all items keys must be re-encrypted', async function () {
    const passcode = 'foo'
    await this.application.addPasscode(passcode)
    await Factory.createSyncedNote(this.application)
    const itemsKeys = this.application.items.getDisplayableItemsKeys()
    expect(itemsKeys.length).to.equal(1)
    const originalItemsKey = itemsKeys[0]

    const originalRootKey = await this.application.encryption.getRootKey()
    /** Expect that we can decrypt raw payload with current root key */
    const rawPayloads = await this.application.storage.getAllRawPayloads()
    const itemsKeyRawPayload = rawPayloads.find((p) => p.uuid === originalItemsKey.uuid)
    const itemsKeyPayload = new EncryptedPayload(itemsKeyRawPayload)
    const decrypted = await this.application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [itemsKeyPayload],
        key: originalRootKey,
      },
    })

    expect(decrypted.errorDecrypting).to.not.be.ok
    expect(decrypted.content).to.eql(originalItemsKey.content)

    /** Change passcode */
    Factory.handlePasswordChallenges(this.application, passcode)
    await this.application.changePasscode('bar')

    const newRootKey = await this.application.encryption.getRootKey()
    expect(newRootKey).to.not.equal(originalRootKey)
    expect(newRootKey.masterKey).to.not.equal(originalRootKey.masterKey)

    /**
     * Expect that originalRootKey can no longer decrypt originalItemsKey
     * as items key has been re-encrypted with new root key
     */
    const rawPayloads2 = await this.application.storage.getAllRawPayloads()
    const itemsKeyRawPayload2 = rawPayloads2.find((p) => p.uuid === originalItemsKey.uuid)
    expect(itemsKeyRawPayload2.content).to.not.equal(itemsKeyRawPayload.content)

    const itemsKeyPayload2 = new EncryptedPayload(itemsKeyRawPayload2)
    const decrypted2 = await this.application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [itemsKeyPayload2],
        key: originalRootKey,
      },
    })
    expect(decrypted2.errorDecrypting).to.equal(true)

    /** Should be able to decrypt with new root key */
    const decrypted3 = await this.application.encryption.decryptSplitSingle({
      usesRootKey: {
        items: [itemsKeyPayload2],
        key: newRootKey,
      },
    })
    expect(decrypted3.errorDecrypting).to.not.be.ok
  })

  it('changing account password should create new items key and encrypt items with that key', async function () {
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    const itemsKeys = this.application.items.getDisplayableItemsKeys()
    expect(itemsKeys.length).to.equal(1)
    const defaultItemsKey = await this.application.encryption.getSureDefaultItemsKey()

    const result = await this.application.changePassword(this.password, 'foobarfoo')
    expect(result.error).to.not.be.ok

    expect(this.application.items.getDisplayableItemsKeys().length).to.equal(2)
    const newDefaultItemsKey = await this.application.encryption.getSureDefaultItemsKey()
    expect(newDefaultItemsKey.uuid).to.not.equal(defaultItemsKey.uuid)

    const note = await Factory.createSyncedNote(this.application)
    const payload = await this.application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })
    expect(payload.items_key_id).to.equal(newDefaultItemsKey.uuid)
  })

  it('changing account email should create new items key and encrypt items with that key', async function () {
    const { application, email, password } = await Factory.createAndInitSimpleAppContext()
    await Factory.registerUserToApplication({
      application: application,
      email: email,
      password: password,
    })
    const itemsKeys = application.items.getDisplayableItemsKeys()
    expect(itemsKeys.length).to.equal(1)
    const defaultItemsKey = application.encryption.getSureDefaultItemsKey()

    const newEmail = UuidGenerator.GenerateUuid()
    const result = await application.changeEmail(newEmail, password)
    expect(result.error).to.not.be.ok

    expect(application.items.getDisplayableItemsKeys().length).to.equal(2)
    const newDefaultItemsKey = application.encryption.getSureDefaultItemsKey()
    expect(newDefaultItemsKey.uuid).to.not.equal(defaultItemsKey.uuid)

    const note = await Factory.createSyncedNote(application)
    const payload = await application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [note.payload],
      },
    })
    expect(payload.items_key_id).to.equal(newDefaultItemsKey.uuid)
    await Factory.safeDeinit(application)
  })

  it('compares root keys', async function () {
    const keyParams = {}
    const a1 = await CreateNewRootKey({
      version: ProtocolVersion.V004,
      masterKey: '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE',
      serverPassword: 'FCDE2B2EDBA56BF408601FB721FE9B5C338D10EE429EA04FAE5511B68FBF8FB9',
      keyParams,
    })
    const a2 = await CreateNewRootKey({
      version: ProtocolVersion.V004,
      masterKey: '2C26B46B68FFC68FF99B453C1D30413413422D706483BFA0F98A5E886266E7AE',
      serverPassword: 'FCDE2B2EDBA56BF408601FB721FE9B5C338D10EE429EA04FAE5511B68FBF8FB9',
      keyParams,
    })
    const b = await CreateNewRootKey({
      version: ProtocolVersion.V004,
      masterKey: '2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824',
      serverPassword: '486EA46224D1BB4FB680F34F7C9AD96A8F24EC88BE73EA8E5A6C65260E9CB8A7',
      keyParams,
    })

    expect(a1.compare(a2)).to.equal(true)
    expect(a2.compare(a1)).to.equal(true)
    expect(a1.compare(b)).to.equal(false)
    expect(b.compare(a1)).to.equal(false)
  })

  it('loading the keychain root key should also load its key params', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const rootKey = await this.application.encryption.rootKeyManager.getRootKeyFromKeychain()
    expect(rootKey.keyParams).to.be.ok
  })

  it('key params should be persisted separately and not as part of root key', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const rawKey = await this.application.device.getNamespacedKeychainValue(this.application.identifier)
    expect(rawKey.keyParams).to.not.be.ok
    const rawKeyParams = await this.application.storage.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(rawKeyParams).to.be.ok
  })

  it('persisted key params should exactly equal in memory rootKey.keyParams', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const rootKey = await this.application.encryption.getRootKey()
    const rawKeyParams = await this.application.storage.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(rootKey.keyParams.content).to.eql(rawKeyParams)
  })

  it('key params should have expected values', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const keyParamsObject = await this.application.encryption.getRootKeyParams()
    const keyParams = keyParamsObject.content
    expect(keyParams.identifier).to.be.ok
    expect(keyParams.pw_nonce).to.be.ok
    expect(keyParams.version).to.equal(ProtocolVersion.V004)
    expect(keyParams.created).to.be.ok
    expect(keyParams.origination).to.equal(KeyParamsOrigination.Registration)
    expect(keyParams.email).to.not.be.ok
    expect(keyParams.pw_cost).to.not.be.ok
    expect(keyParams.pw_salt).to.not.be.ok
  })

  it('key params obtained when signing in should have created and origination', async function () {
    const email = this.email
    const password = this.password
    await Factory.registerUserToApplication({
      application: this.application,
      email,
      password,
    })
    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    await Factory.loginToApplication({
      application: this.application,
      email,
      password,
    })
    const keyParamsObject = await this.application.encryption.getRootKeyParams()
    const keyParams = keyParamsObject.content

    expect(keyParams.created).to.be.ok
    expect(keyParams.origination).to.equal(KeyParamsOrigination.Registration)
  })

  it('key params for 003 account should still have origination and created', async function () {
    /** origination and created are new properties since 004, but they can be added retroactively
     * to previous versions. They are not essential to <= 003, but are for >= 004 */

    /** Register with 003 version */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: ProtocolVersion.V003,
    })
    const keyParamsObject = await this.application.encryption.getRootKeyParams()
    const keyParams = keyParamsObject.content

    expect(keyParams.created).to.be.ok
    expect(keyParams.origination).to.equal(KeyParamsOrigination.Registration)
  })

  it('encryption name should be dependent on key params version', async function () {
    /** Register with 003 account */
    await Factory.registerOldUser({
      application: this.application,
      email: this.email,
      password: this.password,
      version: ProtocolVersion.V003,
    })
    expect(await this.application.encryption.getEncryptionDisplayName()).to.equal('AES-256')

    this.application = await Factory.signOutApplicationAndReturnNew(this.application)
    /** Register with 004 account */
    await this.application.register(this.email + 'new', this.password)
    expect(await this.application.encryption.getEncryptionDisplayName()).to.equal('XChaCha20-Poly1305')
  })

  it('when launching app with no keychain but data, should present account recovery challenge', async function () {
    /**
     * On iOS (and perhaps other platforms where keychains are not included in device backups),
     * when setting up a new device from restore, the keychain is deleted, but the data persists.
     * We want to make sure we're prompting the user to re-authenticate their account.
     */
    const id = this.application.identifier
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    /** Simulate empty keychain */
    await this.application.device.clearRawKeychainValue()

    const recreatedApp = await Factory.createApplicationWithFakeCrypto(id)
    let totalChallenges = 0
    const expectedChallenges = 1
    const receiveChallenge = (challenge) => {
      totalChallenges++
      recreatedApp.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], this.password)])
    }
    await recreatedApp.prepareForLaunch({ receiveChallenge })
    await recreatedApp.launch(true)

    expect(recreatedApp.encryption.getRootKey()).to.be.ok
    expect(totalChallenges).to.equal(expectedChallenges)
    await Factory.safeDeinit(recreatedApp)
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

  describe('changing password on 003 account while signed into 004 client', function () {
    /**
     * When an 004 client signs into 003 account, it creates a root key based items key.
     * Then, if the 003 client changes its account password, and the 004 client
     * re-authenticates, incorrect behavior (2.0.13) would be not to create a new root key based
     * items key based on the new root key. The result would be that when the modified 003
     * items sync to the 004 client, it can't decrypt them with its existing items key
     * because its based on the old root key.
     */
    it.skip('should add new items key', async function () {
      this.timeout(Factory.TwentySecondTimeout * 3)
      let oldClient = this.application

      /** Register an 003 account */
      await Factory.registerOldUser({
        application: oldClient,
        email: this.email,
        password: this.password,
        version: ProtocolVersion.V003,
      })

      /** Sign into account from another app */
      const newClient = await Factory.createAppWithRandNamespace()
      await newClient.prepareForLaunch({
        receiveChallenge: (challenge) => {
          /** Reauth session challenge */
          newClient.submitValuesForChallenge(challenge, [
            CreateChallengeValue(challenge.prompts[0], this.email),
            CreateChallengeValue(challenge.prompts[1], this.password),
          ])
        },
      })
      await newClient.launch()

      /** Change password through session manager directly instead of application,
       * as not to create any items key (to simulate 003 client behavior) */
      const currentRootKey = await oldClient.encryption.computeRootKey(
        this.password,
        await oldClient.encryption.getRootKeyParams(),
      )
      const operator = this.context.operators.operatorForVersion(ProtocolVersion.V003)
      const newRootKey = await operator.createRootKey(this.email, this.password)
      Object.defineProperty(oldClient.legacyApi, 'apiVersion', {
        get: function () {
          return '20190520'
        },
      })

      /**
       * Sign in as late as possible on new client to prevent session timeouts
       */
      await newClient.signIn(this.email, this.password)

      await oldClient.sessions.changeCredentials({
        currentServerPassword: currentRootKey.serverPassword,
        newRootKey,
      })

      /** Re-authenticate on other app; allow challenge to complete */
      await newClient.sync.sync()
      await Factory.sleep(1)

      /** Expect a new items key to be created based on the new root key */
      expect(newClient.items.getDisplayableItemsKeys().length).to.equal(2)

      await Factory.safeDeinit(newClient)
      await Factory.safeDeinit(oldClient)
    })

    it('should add new items key from migration if pw change already happened', async function () {
      this.context.anticipateConsoleError('Shared vault network errors due to not accepting JWT-based token')
      this.context.anticipateConsoleError(
        'Cannot find items key to use for encryption',
        'No items keys being created in this test',
      )

      /** Register an 003 account */
      await Factory.registerOldUser({
        application: this.application,
        email: this.email,
        password: this.password,
        version: ProtocolVersion.V003,
      })

      /** Change password through session manager directly instead of application,
       * as not to create any items key (to simulate 003 client behavior) */
      const currentRootKey = await this.application.encryption.computeRootKey(
        this.password,
        await this.application.encryption.getRootKeyParams(),
      )
      const operator = this.context.operators.operatorForVersion(ProtocolVersion.V003)
      const newRootKeyTemplate = await operator.createRootKey(this.email, this.password)
      const newRootKey = CreateNewRootKey({
        ...newRootKeyTemplate.content,
        ...{
          encryptionKeyPair: {},
          signingKeyPair: {},
        },
      })

      Object.defineProperty(this.application.legacyApi, 'apiVersion', {
        get: function () {
          return '20190520'
        },
      })

      /** Renew session to prevent timeouts */
      this.application = await Factory.signOutAndBackIn(this.application, this.email, this.password)

      await this.application.sessions.changeCredentials({
        currentServerPassword: currentRootKey.serverPassword,
        newRootKey,
      })
      await this.application.dependencies.get(TYPES.ReencryptTypeAItems).execute()
      /** Note: this may result in a deadlock if features_service syncs and results in an error */
      await this.application.sync.sync({ awaitAll: true })

      /** Relaunch application and expect new items key to be created */
      const identifier = this.application.identifier
      /** Set to pre 2.0.15 version so migration runs */
      await this.application.device.setRawStorageValue(`${identifier}-snjs_version`, '2.0.14')
      await Factory.safeDeinit(this.application)

      const refreshedApp = await Factory.createApplicationWithFakeCrypto(identifier)
      await Factory.initializeApplication(refreshedApp)

      /** Expect a new items key to be created based on the new root key */
      expect(refreshedApp.items.getDisplayableItemsKeys().length).to.equal(2)
      await Factory.safeDeinit(refreshedApp)
    })
  })

  it('importing 003 account backup, then registering for account, should properly reconcile keys', async function () {
    /**
     * When importing a backup of an 003 account into an offline state, ItemsKeys imported
     * will have an updated_at value, which tell our protocol service that this key has been
     * synced before, which sort of "lies" to the protocol service because now it thinks it doesnt
     * need to create a new items key because one has already been synced with the account.
     * The corrective action was to do a final check in encryptionService.handleDownloadFirstSyncCompletion
     * to ensure there exists an items key corresponding to the user's account version.
     */
    const promise = this.context.awaitNextSucessfulSync()
    await this.context.sync()
    await promise

    await this.application.items.removeAllItemsFromMemory()
    expect(this.application.encryption.getSureDefaultItemsKey()).to.not.be.ok

    const protocol003 = new SNProtocolOperator003(new SNWebCrypto())
    const key = await protocol003.createItemsKey()
    await this.application.mutator.emitItemFromPayload(
      key.payload.copy({
        content: {
          ...key.payload.content,
          isDefault: true,
        },
        dirty: true,
        /** Important to indicate that the key has been synced with a server */
        updated_at: Date.now(),
      }),
    )

    const defaultKey = this.application.encryption.getSureDefaultItemsKey()
    expect(defaultKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(defaultKey.uuid).to.equal(key.uuid)

    await Factory.registerUserToApplication({ application: this.application })

    const notePayload = Factory.createNotePayload()
    expect(await this.application.encryption.itemsEncryption.keyToUseForItemEncryption(notePayload)).to.be.ok
  })

  it('having unsynced items keys should resync them upon download first sync completion', async function () {
    await Factory.registerUserToApplication({ application: this.application })
    const itemsKey = this.application.items.getDisplayableItemsKeys()[0]
    await this.application.mutator.emitItemFromPayload(
      itemsKey.payload.copy({
        dirty: false,
        updated_at: new Date(0),
        deleted: false,
      }),
    )
    await this.application.sync.sync({
      mode: SyncMode.DownloadFirst,
    })
    const updatedKey = this.application.items.findItem(itemsKey.uuid)
    expect(updatedKey.neverSynced).to.equal(false)
  })

  it('having key while offline then signing into account with key should only have 1 default items key', async function () {
    const otherClient = await Factory.createInitAppWithFakeCrypto()
    /** Invert order of keys */
    otherClient.items.itemsKeyDisplayController.setDisplayOptions({ sortBy: 'dsc' })
    /** On client A, create account and note */
    await Factory.registerUserToApplication({
      application: this.application,
      email: this.email,
      password: this.password,
    })
    await Factory.createSyncedNote(this.application)
    const itemsKey = this.application.items.getItems(ContentType.TYPES.ItemsKey)[0]

    /** Create another client and sign into account */
    await Factory.loginToApplication({
      application: otherClient,
      email: this.email,
      password: this.password,
    })
    const defaultKeys = otherClient.encryption.itemsEncryption.getItemsKeys().filter((key) => {
      return key.isDefault
    })
    expect(defaultKeys.length).to.equal(1)

    const rawPayloads = await otherClient.storage.getAllRawPayloads()
    const notePayload = rawPayloads.find((p) => p.content_type === ContentType.TYPES.Note)

    expect(notePayload.items_key_id).to.equal(itemsKey.uuid)
    await otherClient.deinit()
  })
})
