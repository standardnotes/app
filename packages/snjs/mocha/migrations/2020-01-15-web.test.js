/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
import FakeWebCrypto from '../lib/fake_web_crypto.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('2020-01-15 web migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * This test will pass but sync afterwards will not be successful
   * as we are using a random value for the legacy session token
   */
  it('2020-01-15 migration with passcode and account', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const passcode = 'bar'
    /** Create old version passcode parameters */
    const passcodeKey = await operator003.createRootKey(identifier, passcode)
    await application.deviceInterface.setRawStorageValue(
      'offlineParams',
      JSON.stringify(passcodeKey.keyParams.getPortableValue()),
    )

    /** Create arbitrary storage values and make sure they're migrated */
    const arbitraryValues = {
      foo: 'bar',
      zar: 'tar',
      har: 'car',
    }
    for (const key of Object.keys(arbitraryValues)) {
      await application.deviceInterface.setRawStorageValue(key, arbitraryValues[key])
    }
    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator003.createRootKey(identifier, password)

    /** Create legacy storage and encrypt it with passcode */
    const embeddedStorage = {
      mk: accountKey.masterKey,
      ak: accountKey.dataAuthenticationKey,
      pw: accountKey.serverPassword,
      jwt: 'anything',
      /** Legacy versions would store json strings inside of embedded storage */
      auth_params: JSON.stringify(accountKey.keyParams.getPortableValue()),
    }
    const storagePayload = new DecryptedPayload({
      uuid: await operator003.crypto.generateUUID(),
      content_type: ContentType.EncryptedStorage,
      content: {
        storage: embeddedStorage,
      },
    })
    const encryptionParams = await operator003.generateEncryptedParametersAsync(storagePayload, passcodeKey)
    const persistPayload = new EncryptedPayload({ ...storagePayload, ...encryptionParams })
    await application.deviceInterface.setRawStorageValue('encryptedStorage', JSON.stringify(persistPayload))

    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    await application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        application.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], passcode)])
      },
    })

    await application.launch(true)
    expect(application.sessionManager.online()).to.equal(true)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok

    expect(await application.deviceInterface.getRawStorageValue('offlineParams')).to.not.be.ok

    const keyParams = await application.diskStorageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(typeof keyParams).to.equal('object')

    /** Embedded value should match */
    const migratedKeyParams = await application.diskStorageService.getValue(
      StorageKey.RootKeyParams,
      StorageValueModes.Nonwrapped,
    )
    expect(migratedKeyParams).to.eql(JSON.parse(embeddedStorage.auth_params))
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    /** Application should not retain server password from legacy versions */
    expect(rootKey.serverPassword).to.not.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    /** Ensure arbitrary values have been migrated */
    for (const key of Object.keys(arbitraryValues)) {
      const value = await application.diskStorageService.getValue(key)
      expect(arbitraryValues[key]).to.equal(value)
    }

    console.warn('Expecting exception due to deiniting application while trying to renew session')
    await Factory.safeDeinit(application)
  }).timeout(15000)

  it('2020-01-15 migration with passcode only', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const passcode = 'bar'
    /** Create old version passcode parameters */
    const passcodeKey = await operator003.createRootKey(identifier, passcode)
    await application.deviceInterface.setRawStorageValue(
      'offlineParams',
      JSON.stringify(passcodeKey.keyParams.getPortableValue()),
    )

    /** Create arbitrary storage values and make sure they're migrated */
    const arbitraryValues = {
      foo: 'bar',
      zar: 'tar',
      har: 'car',
    }
    for (const key of Object.keys(arbitraryValues)) {
      await application.deviceInterface.setRawStorageValue(key, arbitraryValues[key])
    }

    const embeddedStorage = {
      ...arbitraryValues,
    }
    const storagePayload = new DecryptedPayload({
      uuid: await operator003.crypto.generateUUID(),
      content: {
        storage: embeddedStorage,
      },
      content_type: ContentType.EncryptedStorage,
    })
    const encryptionParams = await operator003.generateEncryptedParametersAsync(storagePayload, passcodeKey)
    const persistPayload = new EncryptedPayload({ ...storagePayload, ...encryptionParams })
    await application.deviceInterface.setRawStorageValue('encryptedStorage', JSON.stringify(persistPayload))

    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, passcodeKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    await application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        application.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], passcode)])
      },
    })
    await application.launch(true)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.WrapperOnly)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok

    expect(await application.deviceInterface.getRawStorageValue('offlineParams')).to.not.be.ok

    /** Embedded value should match */
    const migratedKeyParams = await application.diskStorageService.getValue(
      StorageKey.RootKeyParams,
      StorageValueModes.Nonwrapped,
    )
    expect(migratedKeyParams).to.eql(embeddedStorage.auth_params)
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey.masterKey).to.equal(passcodeKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(passcodeKey.dataAuthenticationKey)
    /** Root key is in memory with passcode only, so server password can be defined */
    expect(rootKey.serverPassword).to.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.WrapperOnly)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    /** Ensure arbitrary values have been migrated */
    for (const key of Object.keys(arbitraryValues)) {
      const value = await application.diskStorageService.getValue(key)
      expect(arbitraryValues[key]).to.equal(value)
    }
    await Factory.safeDeinit(application)
  })

  /**
   * This test will pass but sync afterwards will not be successful
   * as we are using a random value for the legacy session token
   */
  it('2020-01-15 migration with account only', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'

    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator003.createRootKey(identifier, password)

    /** Create arbitrary storage values and make sure they're migrated */
    const storage = {
      foo: 'bar',
      zar: 'tar',
      har: 'car',
      mk: accountKey.masterKey,
      ak: accountKey.dataAuthenticationKey,
      pw: accountKey.serverPassword,
      jwt: 'anything',
      /** Legacy versions would store json strings inside of embedded storage */
      auth_params: JSON.stringify(accountKey.keyParams.getPortableValue()),
    }
    for (const key of Object.keys(storage)) {
      await application.deviceInterface.setRawStorageValue(key, storage[key])
    }
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        } else {
          /** We will be prompted to reauthetnicate our session, not relevant to this test
           * but pass any value to avoid exception
           */
          values.push(CreateChallengeValue(prompt, 'foo'))
        }
      }
      return values
    }
    const receiveChallenge = async (challenge) => {
      application.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          application.submitValuesForChallenge(challenge, values)
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
    await application.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    await application.launch(true)
    expect(application.sessionManager.online()).to.equal(true)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    /** Embedded value should match */
    const migratedKeyParams = await application.diskStorageService.getValue(
      StorageKey.RootKeyParams,
      StorageValueModes.Nonwrapped,
    )
    expect(migratedKeyParams).to.eql(accountKey.keyParams.getPortableValue())
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.be.ok

    expect(await application.deviceInterface.getRawStorageValue('migrations')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('auth_params')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('jwt')).to.not.be.ok

    const keyParams = await application.diskStorageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(typeof keyParams).to.equal('object')

    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    expect(rootKey.serverPassword).to.not.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    /** Ensure arbitrary values have been migrated */
    for (const key of Object.keys(storage)) {
      /** Is stringified in storage, but parsed in storageService */
      if (key === 'auth_params') {
        continue
      }
      const value = await application.diskStorageService.getValue(key)
      expect(storage[key]).to.equal(value)
    }

    console.warn('Expecting exception due to deiniting application while trying to renew session')
    await Factory.safeDeinit(application)
  })

  it('2020-01-15 migration with no account and no passcode', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    /** Create arbitrary storage values and make sure they're migrated */
    const storage = {
      foo: 'bar',
      zar: 'tar',
      har: 'car',
    }
    for (const key of Object.keys(storage)) {
      await application.deviceInterface.setRawStorageValue(key, storage[key])
    }

    /** Create item and store it in db */
    const notePayload = Factory.createNotePayload()
    await application.deviceInterface.saveRawDatabasePayload(notePayload.ejected(), application.identifier)

    /** Run migration */
    await application.prepareForLaunch({
      receiveChallenge: (_challenge) => {
        return null
      },
    })
    await application.launch(true)

    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyNone)

    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.not.be.ok
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyNone)

    expect(await application.deviceInterface.getRawStorageValue('migrations')).to.not.be.ok

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    /** Ensure arbitrary values have been migrated */
    for (const key of Object.keys(storage)) {
      const value = await application.diskStorageService.getValue(key)
      expect(storage[key]).to.equal(value)
    }

    await Factory.safeDeinit(application)
  })

  /**
   * This test will pass but sync afterwards will not be successful
   * as we are using a random value for the legacy session token
   */
  it('2020-01-15 migration from app v1.0.1 with account only', async function () {
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator001 = new SNProtocolOperator001(new FakeWebCrypto())
    const identifier = 'foo'

    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator001.createRootKey(identifier, password)

    /** Create arbitrary storage values and make sure they're migrated */
    const storage = {
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      jwt: 'anything',
      /** Legacy versions would store json strings inside of embedded storage */
      auth_params: JSON.stringify(accountKey.keyParams.getPortableValue()),
      user: JSON.stringify({ uuid: 'anything', email: 'anything' }),
    }
    for (const key of Object.keys(storage)) {
      await application.deviceInterface.setRawStorageValue(key, storage[key])
    }
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator001.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        /** We will be prompted to reauthetnicate our session, not relevant to this test
         * but pass any value to avoid exception
         */
        values.push(CreateChallengeValue(prompt, 'foo'))
      }
      return values
    }
    const receiveChallenge = async (challenge) => {
      application.addChallengeObserver(challenge, {
        onInvalidValue: (value) => {
          const values = promptValueReply([value.prompt])
          application.submitValuesForChallenge(challenge, values)
        },
      })
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
    await application.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    await application.launch(true)
    expect(application.sessionManager.online()).to.equal(true)
    expect(application.sessionManager.getUser()).to.be.ok
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    /** Embedded value should match */
    const migratedKeyParams = await application.diskStorageService.getValue(
      StorageKey.RootKeyParams,
      StorageValueModes.Nonwrapped,
    )
    expect(migratedKeyParams).to.eql(accountKey.keyParams.getPortableValue())
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.be.ok

    expect(await application.deviceInterface.getRawStorageValue('migrations')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('auth_params')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('jwt')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('ak')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('mk')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('pw')).to.not.be.ok

    const keyParams = await application.diskStorageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(typeof keyParams).to.equal('object')

    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    expect(rootKey.serverPassword).to.not.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V001)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    /** Ensure arbitrary values have been migrated */
    for (const key of Object.keys(storage)) {
      /** Is stringified in storage, but parsed in storageService */
      const value = await application.diskStorageService.getValue(key)
      if (key === 'auth_params') {
        continue
      } else if (key === 'user') {
        expect(storage[key]).to.equal(JSON.stringify(value))
      } else {
        expect(storage[key]).to.equal(value)
      }
    }
    await Factory.safeDeinit(application)
  })

  it('2020-01-15 migration from 002 app with account and passcode but missing offlineParams.version', async function () {
    /**
     * There was an issue where if the user had offlineParams but it was missing the version key,
     * the user could not get past the passcode migration screen.
     */
    const application = await Factory.createAppWithRandNamespace()
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator002 = new SNProtocolOperator002(new FakeWebCrypto())
    const identifier = 'foo'
    const passcode = 'bar'
    /** Create old version passcode parameters */
    const passcodeKey = await operator002.createRootKey(identifier, passcode)

    /** The primary chaos agent */
    const offlineParams = passcodeKey.keyParams.getPortableValue()
    omitInPlace(offlineParams, ['version'])

    await application.deviceInterface.setRawStorageValue('offlineParams', JSON.stringify(offlineParams))

    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator002.createRootKey(identifier, password)

    /** Create legacy storage and encrypt it with passcode */
    const embeddedStorage = {
      mk: accountKey.masterKey,
      ak: accountKey.dataAuthenticationKey,
      pw: accountKey.serverPassword,
      jwt: 'anything',
      /** Legacy versions would store json strings inside of embedded storage */
      auth_params: JSON.stringify(accountKey.keyParams.getPortableValue()),
      user: JSON.stringify({ uuid: 'anything', email: 'anything' }),
    }
    const storagePayload = new DecryptedPayload({
      uuid: await operator002.crypto.generateUUID(),
      content_type: ContentType.EncryptedStorage,
      content: {
        storage: embeddedStorage,
      },
    })
    const encryptionParams = await operator002.generateEncryptedParametersAsync(storagePayload, passcodeKey)
    const persistPayload = new EncryptedPayload({ ...storagePayload, ...encryptionParams })
    await application.deviceInterface.setRawStorageValue('encryptedStorage', JSON.stringify(persistPayload))

    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator002.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Runs migration */
    await application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        application.submitValuesForChallenge(challenge, [CreateChallengeValue(challenge.prompts[0], passcode)])
      },
    })
    await application.launch(true)
    expect(application.sessionManager.online()).to.equal(true)
    expect(application.sessionManager.getUser()).to.be.ok
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    /** Embedded value should match */
    const migratedKeyParams = await application.diskStorageService.getValue(
      StorageKey.RootKeyParams,
      StorageValueModes.Nonwrapped,
    )
    expect(migratedKeyParams).to.eql(accountKey.keyParams.getPortableValue())
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.be.ok

    expect(await application.deviceInterface.getRawStorageValue('migrations')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('auth_params')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('jwt')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('ak')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('mk')).to.not.be.ok
    expect(await application.deviceInterface.getRawStorageValue('pw')).to.not.be.ok

    const keyParams = await application.diskStorageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(typeof keyParams).to.equal('object')

    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    expect(rootKey.serverPassword).to.not.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V002)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    await Factory.safeDeinit(application)
  })
})
