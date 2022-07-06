/* eslint-disable no-undef */
import * as Factory from '../lib/factory.js'
import * as Utils from '../lib/Utils.js'
import FakeWebCrypto from '../lib/fake_web_crypto.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('2020-01-15 mobile migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it(
    '2020-01-15 migration with passcode and account',
    async function () {
      let application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)

      /** Create legacy migrations value so that base migration detects old app */
      await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
      const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
      const identifier = 'foo'
      const passcode = 'bar'
      /** Create old version passcode parameters */
      const passcodeKey = await operator003.createRootKey(identifier, passcode)
      await application.deviceInterface.setRawStorageValue(
        'pc_params',
        JSON.stringify(passcodeKey.keyParams.getPortableValue()),
      )
      const passcodeTiming = 'immediately'

      /** Create old version account parameters */
      const password = 'tar'
      const accountKey = await operator003.createRootKey(identifier, password)
      await application.deviceInterface.setRawStorageValue(
        'auth_params',
        JSON.stringify(accountKey.keyParams.getPortableValue()),
      )
      const customServer = 'http://server-dev.standardnotes.org'
      await application.deviceInterface.setRawStorageValue(
        'user',
        JSON.stringify({ email: identifier, server: customServer }),
      )
      await application.deviceInterface.setLegacyRawKeychainValue({
        offline: {
          pw: passcodeKey.serverPassword,
          timing: passcodeTiming,
        },
      })
      /** Wrap account key with passcode key and store in storage */
      const keyPayload = new DecryptedPayload({
        uuid: Utils.generateUuid(),
        content_type: 'SN|Mobile|EncryptedKeys',
        content: {
          accountKeys: {
            jwt: 'foo',
            mk: accountKey.masterKey,
            ak: accountKey.dataAuthenticationKey,
            pw: accountKey.serverPassword,
          },
        },
      })
      const encryptedKeyParams = await operator003.generateEncryptedParametersAsync(keyPayload, passcodeKey)
      const wrappedKey = new EncryptedPayload({ ...keyPayload.ejected(), ...encryptedKeyParams })
      await application.deviceInterface.setRawStorageValue('encrypted_account_keys', JSON.stringify(wrappedKey))
      const biometricPrefs = { enabled: true, timing: 'immediately' }
      /** Create legacy storage. Storage in mobile was never wrapped. */
      await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
      await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
      /** Create encrypted item and store it in db */
      const notePayload = Factory.createNotePayload()
      const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
      const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
      await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)
      /** setup options */
      const lastExportDate = '2020:02'
      await application.deviceInterface.setRawStorageValue('LastExportDateKey', lastExportDate)
      const options = JSON.stringify({
        sortBy: 'userModifiedAt',
        sortReverse: undefined,
        selectedTagIds: [],
        hidePreviews: true,
        hideDates: false,
        hideTags: false,
      })
      await application.deviceInterface.setRawStorageValue('options', options)
      /** Run migration */
      const promptValueReply = (prompts) => {
        const values = []
        for (const prompt of prompts) {
          if (
            prompt.validation === ChallengeValidation.None ||
            prompt.validation === ChallengeValidation.LocalPasscode
          ) {
            values.push(CreateChallengeValue(prompt, passcode))
          }
          if (prompt.validation === ChallengeValidation.Biometric) {
            values.push(CreateChallengeValue(prompt, true))
          }
        }
        return values
      }
      const receiveChallenge = async (challenge) => {
        const values = promptValueReply(challenge.prompts)
        application.submitValuesForChallenge(challenge, values)
      }
      await application.prepareForLaunch({
        receiveChallenge,
      })
      await application.launch(true)

      expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)

      /** Should be decrypted */
      const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
      const valueStore = application.diskStorageService.values[storageMode]
      expect(valueStore.content_type).to.not.be.ok

      const keyParams = await application.diskStorageService.getValue(
        StorageKey.RootKeyParams,
        StorageValueModes.Nonwrapped,
      )
      expect(typeof keyParams).to.equal('object')
      const rootKey = await application.protocolService.getRootKey()
      expect(rootKey.masterKey).to.equal(accountKey.masterKey)
      expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
      expect(rootKey.serverPassword).to.not.be.ok
      expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
      expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)

      const keychainValue = await application.deviceInterface.getNamespacedKeychainValue(application.identifier)
      expect(keychainValue).to.not.be.ok

      /** Expect note is decrypted */
      expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
      const retrievedNote = application.itemManager.getDisplayableNotes()[0]
      expect(retrievedNote.uuid).to.equal(notePayload.uuid)
      expect(retrievedNote.content.text).to.equal(notePayload.content.text)

      expect(
        await application.diskStorageService.getValue(NonwrappedStorageKey.MobileFirstRun, StorageValueModes.Nonwrapped),
      ).to.equal(false)

      expect(
        await application.diskStorageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped),
      ).to.equal(biometricPrefs.enabled)
      expect(
        await application.diskStorageService.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped),
      ).to.equal(biometricPrefs.timing)
      expect(await application.getUser().email).to.equal(identifier)

      const appId = application.identifier
      console.warn('Expecting exception due to deiniting application while trying to renew session')

      /** Full sync completed event will not trigger due to mocked credentials,
       * thus we manually need to mark any sync dependent migrations as complete. */
      await application.migrationService.markMigrationsAsDone()
      await Factory.safeDeinit(application)

      /** Recreate application and ensure storage values are consistent */
      application = Factory.createApplicationWithFakeCrypto(appId)
      await application.prepareForLaunch({
        receiveChallenge,
      })
      await application.launch(true)
      expect(await application.getUser().email).to.equal(identifier)
      expect(await application.getHost()).to.equal(customServer)
      const preferences = await application.diskStorageService.getValue('preferences')
      expect(preferences.sortBy).to.equal('userModifiedAt')
      expect(preferences.sortReverse).to.be.false
      expect(preferences.hideDate).to.be.false
      expect(preferences.hideTags).to.be.false
      expect(preferences.hideNotePreview).to.be.true
      expect(preferences.lastExportDate).to.equal(lastExportDate)
      expect(preferences.doNotShowAgainUnsupportedEditors).to.be.false
      console.warn('Expecting exception due to deiniting application while trying to renew session')
      await Factory.safeDeinit(application)
    },
    Factory.TwentySecondTimeout,
  )

  it('2020-01-15 migration with passcode only', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const passcode = 'bar'
    /** Create old version passcode parameters */
    const passcodeKey = await operator003.createRootKey(identifier, passcode)
    await application.deviceInterface.setRawStorageValue(
      'pc_params',
      JSON.stringify(passcodeKey.keyParams.getPortableValue()),
    )
    const passcodeTiming = 'immediately'
    await application.deviceInterface.setLegacyRawKeychainValue({
      offline: {
        pw: passcodeKey.serverPassword,
        timing: passcodeTiming,
      },
    })

    const biometricPrefs = { enabled: true, timing: 'immediately' }
    /** Create legacy storage. Storage in mobile was never wrapped. */
    await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
    const passcodeKeyboardType = 'numeric'
    await application.deviceInterface.setRawStorageValue('passcodeKeyboardType', passcodeKeyboardType)
    await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, passcodeKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)
    /** setup options */
    await application.deviceInterface.setRawStorageValue('DoNotShowAgainUnsupportedEditorsKey', true)
    const options = JSON.stringify({
      sortBy: undefined,
      sortReverse: undefined,
      selectedTagIds: [],
      hidePreviews: false,
      hideDates: undefined,
      hideTags: true,
    })
    await application.deviceInterface.setRawStorageValue('options', options)
    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None || prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        }
        if (prompt.validation === ChallengeValidation.Biometric) {
          values.push(CreateChallengeValue(prompt, true))
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
      await Factory.sleep(0)
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
    await application.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.WrapperOnly)
    await application.launch(true)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok

    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey.masterKey).to.equal(passcodeKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(passcodeKey.dataAuthenticationKey)
    /** Root key is in memory with passcode only, so server password can be defined */
    expect(rootKey.serverPassword).to.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.WrapperOnly)

    const keychainValue = await application.deviceInterface.getNamespacedKeychainValue(application.identifier)
    expect(keychainValue).to.not.be.ok

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)
    expect(
      await application.diskStorageService.getValue(NonwrappedStorageKey.MobileFirstRun, StorageValueModes.Nonwrapped),
    ).to.equal(false)
    expect(
      await application.diskStorageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.enabled)
    expect(
      await application.diskStorageService.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.timing)
    expect(
      await application.diskStorageService.getValue(StorageKey.MobilePasscodeTiming, StorageValueModes.Nonwrapped),
    ).to.eql(passcodeTiming)
    expect(
      await application.diskStorageService.getValue(StorageKey.MobilePasscodeKeyboardType, StorageValueModes.Nonwrapped),
    ).to.eql(passcodeKeyboardType)
    const preferences = await application.diskStorageService.getValue('preferences')
    expect(preferences.sortBy).to.equal(undefined)
    expect(preferences.sortReverse).to.be.false
    expect(preferences.hideNotePreview).to.be.false
    expect(preferences.hideDate).to.be.false
    expect(preferences.hideTags).to.be.true
    expect(preferences.lastExportDate).to.equal(undefined)
    expect(preferences.doNotShowAgainUnsupportedEditors).to.be.true
    await Factory.safeDeinit(application)
  })

  it('2020-01-15 migration with passcode-only missing keychain', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const passcode = 'bar'
    /** Create old version passcode parameters */
    const passcodeKey = await operator003.createRootKey(identifier, passcode)
    await application.deviceInterface.setRawStorageValue(
      'pc_params',
      JSON.stringify(passcodeKey.keyParams.getPortableValue()),
    )
    const biometricPrefs = { enabled: true, timing: 'immediately' }
    /** Create legacy storage. Storage in mobile was never wrapped. */
    await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
    const passcodeKeyboardType = 'numeric'
    await application.deviceInterface.setRawStorageValue('passcodeKeyboardType', passcodeKeyboardType)
    await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, passcodeKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)
    /** setup options */
    await application.deviceInterface.setRawStorageValue('DoNotShowAgainUnsupportedEditorsKey', true)
    const options = JSON.stringify({
      sortBy: undefined,
      sortReverse: undefined,
      selectedTagIds: [],
      hidePreviews: false,
      hideDates: undefined,
      hideTags: true,
    })
    await application.deviceInterface.setRawStorageValue('options', options)
    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None || prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        }
        if (prompt.validation === ChallengeValidation.Biometric) {
          values.push(CreateChallengeValue(prompt, true))
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
      await Factory.sleep(0)
      const initialValues = promptValueReply(challenge.prompts)
      application.submitValuesForChallenge(challenge, initialValues)
    }
    await application.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.WrapperOnly)
    await application.launch(true)

    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.errorDecrypting).to.not.be.ok

    /** application should not crash */
    await Factory.safeDeinit(application)
  })

  it('2020-01-15 migration with account only', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator003.createRootKey(identifier, password)
    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify(accountKey.keyParams.getPortableValue()),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: identifier }))
    expect(accountKey.keyVersion).to.equal(ProtocolVersion.V003)
    await application.deviceInterface.setLegacyRawKeychainValue({
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      ak: accountKey.dataAuthenticationKey,
      jwt: 'foo',
      version: ProtocolVersion.V003,
    })
    const biometricPrefs = {
      enabled: true,
      timing: 'immediately',
    }
    /** Create legacy storage. Storage in mobile was never wrapped. */
    await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
    await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)
    /** setup options */
    const lastExportDate = '2020:02'
    await application.deviceInterface.setRawStorageValue('LastExportDateKey', lastExportDate)
    await application.deviceInterface.setRawStorageValue('DoNotShowAgainUnsupportedEditorsKey', false)
    const options = JSON.stringify({
      sortBy: 'created_at',
      sortReverse: undefined,
      selectedTagIds: [],
      hidePreviews: true,
      hideDates: false,
    })
    await application.deviceInterface.setRawStorageValue('options', options)
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None) {
          values.push(CreateChallengeValue(prompt, password))
        }
        if (prompt.validation === ChallengeValidation.Biometric) {
          values.push(CreateChallengeValue(prompt, true))
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
    /** Runs migration */
    await application.prepareForLaunch({
      receiveChallenge: receiveChallenge,
    })
    await application.launch(true)

    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    expect(rootKey.serverPassword).to.not.be.ok
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)

    const keyParams = await application.diskStorageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    expect(typeof keyParams).to.equal('object')

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)
    expect(
      await application.diskStorageService.getValue(NonwrappedStorageKey.MobileFirstRun, StorageValueModes.Nonwrapped),
    ).to.equal(false)
    expect(
      await application.diskStorageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.enabled)
    expect(
      await application.diskStorageService.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.timing)
    expect(await application.getUser().email).to.equal(identifier)
    const preferences = await application.diskStorageService.getValue('preferences')
    expect(preferences.sortBy).to.equal('created_at')
    expect(preferences.sortReverse).to.be.false
    expect(preferences.hideDate).to.be.false
    expect(preferences.hideNotePreview).to.be.true
    expect(preferences.lastExportDate).to.equal(lastExportDate)
    expect(preferences.doNotShowAgainUnsupportedEditors).to.be.false
    console.warn('Expecting exception due to deiniting application while trying to renew session')
    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 launching with account but missing keychain', async function () {
    /**
     * We expect that the keychain will attempt to be recovered
     * We expect two challenges, one to recover just the keychain
     * and another to recover the user session via a sign in request
     */

    /** Register a real user so we can attempt to sign back into this account later */
    const tempApp = await Factory.createInitAppWithFakeCrypto(Environment.Mobile, Platform.Ios)
    const email = UuidGenerator.GenerateUuid()
    const password = UuidGenerator.GenerateUuid()
    /** Register with 003 account */
    await Factory.registerOldUser({
      application: tempApp,
      email: email,
      password: password,
      version: ProtocolVersion.V003,
    })
    const accountKey = tempApp.protocolService.getRootKey()
    await Factory.safeDeinit(tempApp)
    localStorage.clear()

    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    /** Create old version account parameters */
    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify(accountKey.keyParams.getPortableValue()),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: email }))
    expect(accountKey.keyVersion).to.equal(ProtocolVersion.V003)

    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.placeholder === SessionStrings.EmailInputPlaceholder) {
          values.push(CreateChallengeValue(prompt, email))
        } else if (prompt.placeholder === SessionStrings.PasswordInputPlaceholder) {
          values.push(CreateChallengeValue(prompt, password))
        } else {
          throw Error('Unhandled prompt')
        }
      }
      return values
    }
    let totalChallenges = 0
    const expectedChallenges = 2
    const receiveChallenge = async (challenge) => {
      totalChallenges++
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

    /** Recovery migration is non-blocking, so let's block for it */
    await Factory.sleep(1.0)

    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok
    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.be.ok
    expect(rootKey.masterKey).to.equal(accountKey.masterKey)
    expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
    expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyOnly)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)
    expect(await application.getUser().email).to.equal(email)
    expect(await application.apiService.getSession()).to.be.ok
    expect(totalChallenges).to.equal(expectedChallenges)
    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 migration with 002 account should not create 003 data', async function () {
    /** There was an issue where 002 account loading new app would create new default items key
     * with 003 version. Should be 002. */
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator002 = new SNProtocolOperator002(new FakeWebCrypto())
    const identifier = 'foo'
    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator002.createRootKey(identifier, password)
    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify(accountKey.keyParams.getPortableValue()),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: identifier }))
    expect(accountKey.keyVersion).to.equal(ProtocolVersion.V002)
    await application.deviceInterface.setLegacyRawKeychainValue({
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      ak: accountKey.dataAuthenticationKey,
      jwt: 'foo',
    })
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator002.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None) {
          values.push(CreateChallengeValue(prompt, password))
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

    const itemsKey = application.itemManager.getDisplayableItemsKeys()[0]
    expect(itemsKey.keyVersion).to.equal(ProtocolVersion.V002)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    expect(await application.getUser().email).to.equal(identifier)
    console.warn('Expecting exception due to deiniting application while trying to renew session')
    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 migration with 001 account detect 001 version even with missing info', async function () {
    /** If 001 account, and for some reason we dont have version stored, the migrations
     * should determine correct version based on saved payloads */
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator001 = new SNProtocolOperator001(new FakeWebCrypto())
    const identifier = 'foo'
    /** Create old version account parameters */
    const password = 'tar'
    const accountKey = await operator001.createRootKey(identifier, password)
    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify({
        ...accountKey.keyParams.getPortableValue(),
        version: undefined,
      }),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: identifier }))
    expect(accountKey.keyVersion).to.equal(ProtocolVersion.V001)
    await application.deviceInterface.setLegacyRawKeychainValue({
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      jwt: 'foo',
    })
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    const noteEncryptionParams = await operator001.generateEncryptedParametersAsync(notePayload, accountKey)
    const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
    await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)

    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None) {
          values.push(CreateChallengeValue(prompt, password))
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

    const itemsKey = application.itemManager.getDisplayableItemsKeys()[0]
    expect(itemsKey.keyVersion).to.equal(ProtocolVersion.V001)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)

    expect(await application.getUser().email).to.equal(identifier)
    console.warn('Expecting exception due to deiniting application while trying to renew session')
    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 successfully creates session if jwt is stored in keychain', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const password = 'tar'
    const accountKey = await operator003.createRootKey(identifier, password)

    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify(accountKey.keyParams.getPortableValue()),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: identifier }))

    await application.deviceInterface.setLegacyRawKeychainValue({
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      ak: accountKey.dataAuthenticationKey,
      jwt: 'foo',
      version: ProtocolVersion.V003,
    })

    await application.prepareForLaunch({ receiveChallenge: () => {} })
    await application.launch(true)

    expect(application.apiService.getSession()).to.be.ok

    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 successfully creates session if jwt is stored in storage', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
    const identifier = 'foo'
    const password = 'tar'
    const accountKey = await operator003.createRootKey(identifier, password)
    await application.deviceInterface.setRawStorageValue(
      'auth_params',
      JSON.stringify(accountKey.keyParams.getPortableValue()),
    )
    await application.deviceInterface.setRawStorageValue('user', JSON.stringify({ email: identifier, jwt: 'foo' }))
    await application.deviceInterface.setLegacyRawKeychainValue({
      mk: accountKey.masterKey,
      pw: accountKey.serverPassword,
      ak: accountKey.dataAuthenticationKey,
      version: ProtocolVersion.V003,
    })

    await application.prepareForLaunch({ receiveChallenge: () => {} })
    await application.launch(true)

    expect(application.apiService.getSession()).to.be.ok

    await Factory.safeDeinit(application)
  }).timeout(10000)

  it('2020-01-15 migration with no account and no passcode', async function () {
    const application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
    /** Create legacy migrations value so that base migration detects old app */
    await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
    const biometricPrefs = {
      enabled: true,
      timing: 'immediately',
    }
    /** Create legacy storage. Storage in mobile was never wrapped. */
    await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
    await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
    /** Create encrypted item and store it in db */
    const notePayload = Factory.createNotePayload()
    await application.deviceInterface.saveRawDatabasePayload(notePayload.ejected(), application.identifier)
    /** setup options */
    await application.deviceInterface.setRawStorageValue('DoNotShowAgainUnsupportedEditorsKey', true)
    const options = JSON.stringify({
      sortBy: 'created_at',
      sortReverse: undefined,
      selectedTagIds: [],
      hidePreviews: true,
      hideDates: false,
    })
    await application.deviceInterface.setRawStorageValue('options', options)
    /** Run migration */
    const promptValueReply = (prompts) => {
      const values = []
      for (const prompt of prompts) {
        if (prompt.validation === ChallengeValidation.None || prompt.validation === ChallengeValidation.LocalPasscode) {
          values.push(CreateChallengeValue(prompt, passcode))
        }
        if (prompt.validation === ChallengeValidation.Biometric) {
          values.push(CreateChallengeValue(prompt, true))
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

    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyNone)
    /** Should be decrypted */
    const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
    const valueStore = application.diskStorageService.values[storageMode]
    expect(valueStore.content_type).to.not.be.ok

    const rootKey = await application.protocolService.getRootKey()
    expect(rootKey).to.not.be.ok
    expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyNone)

    /** Expect note is decrypted */
    expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
    const retrievedNote = application.itemManager.getDisplayableNotes()[0]
    expect(retrievedNote.uuid).to.equal(notePayload.uuid)
    expect(retrievedNote.content.text).to.equal(notePayload.content.text)
    expect(
      await application.diskStorageService.getValue(NonwrappedStorageKey.MobileFirstRun, StorageValueModes.Nonwrapped),
    ).to.equal(false)
    expect(
      await application.diskStorageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.enabled)
    expect(
      await application.diskStorageService.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped),
    ).to.equal(biometricPrefs.timing)
    const preferences = await application.diskStorageService.getValue('preferences')
    expect(preferences.sortBy).to.equal('created_at')
    expect(preferences.sortReverse).to.be.false
    expect(preferences.hideDate).to.be.false
    expect(preferences.hideNotePreview).to.be.true
    expect(preferences.lastExportDate).to.equal(undefined)
    expect(preferences.doNotShowAgainUnsupportedEditors).to.be.true
    await Factory.safeDeinit(application)
  })

  it(
    '2020-01-15 migration from mobile version 3.0.16',
    async function () {
      /**
       * In version 3.0.16, encrypted account keys were stored in keychain, not storage.
       * This was migrated in version 3.0.17, but we want to be sure we can go from 3.0.16
       * to current state directly.
       */
      let application = await Factory.createAppWithRandNamespace(Environment.Mobile, Platform.Ios)
      /** Create legacy migrations value so that base migration detects old app */
      await application.deviceInterface.setRawStorageValue('migrations', JSON.stringify(['anything']))
      const operator003 = new SNProtocolOperator003(new FakeWebCrypto())
      const identifier = 'foo'
      const passcode = 'bar'
      /** Create old version passcode parameters */
      const passcodeKey = await operator003.createRootKey(identifier, passcode)
      await application.deviceInterface.setRawStorageValue(
        'pc_params',
        JSON.stringify(passcodeKey.keyParams.getPortableValue()),
      )
      const passcodeTiming = 'immediately'

      /** Create old version account parameters */
      const password = 'tar'
      const accountKey = await operator003.createRootKey(identifier, password)
      await application.deviceInterface.setRawStorageValue(
        'auth_params',
        JSON.stringify(accountKey.keyParams.getPortableValue()),
      )
      const customServer = 'http://server-dev.standardnotes.org'
      await application.deviceInterface.setRawStorageValue(
        'user',
        JSON.stringify({ email: identifier, server: customServer }),
      )
      /** Wrap account key with passcode key and store in storage */
      const keyPayload = new DecryptedPayload({
        uuid: Utils.generateUuid(),
        content_type: 'SN|Mobile|EncryptedKeys',
        content: {
          accountKeys: {
            jwt: 'foo',
            mk: accountKey.masterKey,
            ak: accountKey.dataAuthenticationKey,
            pw: accountKey.serverPassword,
          },
        },
      })
      const encryptedKeyParams = await operator003.generateEncryptedParametersAsync(keyPayload, passcodeKey)
      const wrappedKey = new EncryptedPayload({ ...keyPayload, ...encryptedKeyParams })
      await application.deviceInterface.setLegacyRawKeychainValue({
        encryptedAccountKeys: wrappedKey,
        offline: {
          pw: passcodeKey.serverPassword,
          timing: passcodeTiming,
        },
      })
      const biometricPrefs = { enabled: true, timing: 'immediately' }
      /** Create legacy storage. Storage in mobile was never wrapped. */
      await application.deviceInterface.setRawStorageValue('biometrics_prefs', JSON.stringify(biometricPrefs))
      await application.deviceInterface.setRawStorageValue(NonwrappedStorageKey.MobileFirstRun, false)
      /** Create encrypted item and store it in db */
      const notePayload = Factory.createNotePayload()
      const noteEncryptionParams = await operator003.generateEncryptedParametersAsync(notePayload, accountKey)
      const noteEncryptedPayload = new EncryptedPayload({ ...notePayload, ...noteEncryptionParams })
      await application.deviceInterface.saveRawDatabasePayload(noteEncryptedPayload, application.identifier)
      /** setup options */
      const lastExportDate = '2020:02'
      await application.deviceInterface.setRawStorageValue('LastExportDateKey', lastExportDate)
      const options = JSON.stringify({
        sortBy: 'userModifiedAt',
        sortReverse: undefined,
        selectedTagIds: [],
        hidePreviews: true,
        hideDates: false,
        hideTags: false,
      })
      await application.deviceInterface.setRawStorageValue('options', options)
      /** Run migration */
      const promptValueReply = (prompts) => {
        const values = []
        for (const prompt of prompts) {
          if (
            prompt.validation === ChallengeValidation.None ||
            prompt.validation === ChallengeValidation.LocalPasscode
          ) {
            values.push(CreateChallengeValue(prompt, passcode))
          }
          if (prompt.validation === ChallengeValidation.Biometric) {
            values.push(CreateChallengeValue(prompt, true))
          }
        }
        return values
      }
      const receiveChallenge = async (challenge) => {
        const values = promptValueReply(challenge.prompts)
        application.submitValuesForChallenge(challenge, values)
      }
      await application.prepareForLaunch({
        receiveChallenge,
      })
      await application.launch(true)

      expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)

      /** Should be decrypted */
      const storageMode = application.diskStorageService.domainKeyForMode(StorageValueModes.Default)
      const valueStore = application.diskStorageService.values[storageMode]
      expect(valueStore.content_type).to.not.be.ok

      const keyParams = await application.diskStorageService.getValue(
        StorageKey.RootKeyParams,
        StorageValueModes.Nonwrapped,
      )
      expect(typeof keyParams).to.equal('object')
      const rootKey = await application.protocolService.getRootKey()
      expect(rootKey.masterKey).to.equal(accountKey.masterKey)
      expect(rootKey.dataAuthenticationKey).to.equal(accountKey.dataAuthenticationKey)
      expect(rootKey.serverPassword).to.not.be.ok
      expect(rootKey.keyVersion).to.equal(ProtocolVersion.V003)
      expect(application.protocolService.rootKeyEncryption.keyMode).to.equal(KeyMode.RootKeyPlusWrapper)

      const keychainValue = await application.deviceInterface.getNamespacedKeychainValue(application.identifier)
      expect(keychainValue).to.not.be.ok

      /** Expect note is decrypted */
      expect(application.itemManager.getDisplayableNotes().length).to.equal(1)
      const retrievedNote = application.itemManager.getDisplayableNotes()[0]
      expect(retrievedNote.uuid).to.equal(notePayload.uuid)
      expect(retrievedNote.content.text).to.equal(notePayload.content.text)

      expect(
        await application.diskStorageService.getValue(NonwrappedStorageKey.MobileFirstRun, StorageValueModes.Nonwrapped),
      ).to.equal(false)

      expect(
        await application.diskStorageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped),
      ).to.equal(biometricPrefs.enabled)
      expect(
        await application.diskStorageService.getValue(StorageKey.MobileBiometricsTiming, StorageValueModes.Nonwrapped),
      ).to.equal(biometricPrefs.timing)
      expect(await application.getUser().email).to.equal(identifier)

      const appId = application.identifier
      console.warn('Expecting exception due to deiniting application while trying to renew session')
      /** Full sync completed event will not trigger due to mocked credentials,
       * thus we manually need to mark any sync dependent migrations as complete. */
      await application.migrationService.markMigrationsAsDone()
      await Factory.safeDeinit(application)

      /** Recreate application and ensure storage values are consistent */
      application = Factory.createApplicationWithFakeCrypto(appId)
      await application.prepareForLaunch({
        receiveChallenge,
      })
      await application.launch(true)
      expect(await application.getUser().email).to.equal(identifier)
      expect(await application.getHost()).to.equal(customServer)
      const preferences = await application.diskStorageService.getValue('preferences')
      expect(preferences.sortBy).to.equal('userModifiedAt')
      expect(preferences.sortReverse).to.be.false
      expect(preferences.hideDate).to.be.false
      expect(preferences.hideTags).to.be.false
      expect(preferences.hideNotePreview).to.be.true
      expect(preferences.lastExportDate).to.equal(lastExportDate)
      expect(preferences.doNotShowAgainUnsupportedEditors).to.be.false
      console.warn('Expecting exception due to deiniting application while trying to renew session')
      await Factory.safeDeinit(application)
    },
    Factory.TwentySecondTimeout,
  )
})
