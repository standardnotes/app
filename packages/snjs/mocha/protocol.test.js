import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('protocol', function () {
  let application

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = null
    localStorage.clear()
  })

  it('checks version to make sure its 004', function () {
    expect(application.encryption.getLatestVersion()).to.equal('004')
  })

  it('checks supported versions to make sure it includes 001, 002, 003, 004', function () {
    expect(application.encryption.supportedVersions()).to.eql(['001', '002', '003', '004'])
  })

  it('platform derivation support', function () {
    expect(
      application.encryption.platformSupportsKeyDerivation({
        version: '001',
      }),
    ).to.equal(true)
    expect(
      application.encryption.platformSupportsKeyDerivation({
        version: '002',
      }),
    ).to.equal(true)
    expect(
      application.encryption.platformSupportsKeyDerivation({
        version: '003',
      }),
    ).to.equal(true)
    expect(
      application.encryption.platformSupportsKeyDerivation({
        version: '004',
      }),
    ).to.equal(true)
    expect(
      application.encryption.platformSupportsKeyDerivation({
        version: '005',
      }),
    ).to.equal(true)
  })

  it('key params versions <= 002 should include pw_cost in portable value', function () {
    const keyParams002 = application.encryption.createKeyParams({
      version: '002',
      pw_cost: 5000,
    })
    expect(keyParams002.getPortableValue().pw_cost).to.be.ok
  })

  it('version comparison of 002 should be older than library version', function () {
    expect(application.encryption.isVersionNewerThanLibraryVersion('002')).to.equal(false)
  })

  it('version comparison of 005 should be newer than library version', function () {
    expect(application.encryption.isVersionNewerThanLibraryVersion('005')).to.equal(true)
  })

  it('library version should not be outdated', function () {
    var currentVersion = application.encryption.getLatestVersion()
    expect(isProtocolVersionExpired(currentVersion)).to.equal(false)
  })

  it('001 protocol should be expired', function () {
    expect(isProtocolVersionExpired(ProtocolVersion.V001)).to.equal(true)
  })

  it('002 protocol should be expired', function () {
    expect(isProtocolVersionExpired(ProtocolVersion.V002)).to.equal(true)
  })

  it('004 protocol should not be expired', function () {
    expect(isProtocolVersionExpired(ProtocolVersion.V004)).to.equal(false)
  })

  it('decrypting already decrypted payload should throw', async function () {
    const payload = Factory.createNotePayload()
    let error
    try {
      await application.encryption.decryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      })
    } catch (e) {
      error = e
    }
    expect(error).to.be.ok
  })

  it('ejected payload should not have meta fields', async function () {
    await application.addPasscode('123')
    const payload = Factory.createNotePayload()
    const result = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(result.fields).to.not.be.ok
    expect(result.source).to.not.be.ok
    expect(result.format).to.not.be.ok
    expect(result.dirtyIndex).to.not.be.ok
  })

  it('encrypted payload for server should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })

  it('ejected payload for server should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })

  it('encrypted payload for storage should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedLocalStorageContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })

  it('ejected payload for storage should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedLocalStorageContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })

  it('encrypted payload for file should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedBackupFileContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })

  it('ejected payload for file should include duplicate_of field', async function () {
    const payload = Factory.createNotePayload('Test')
    const encryptedPayload = CreateEncryptedBackupFileContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })
})
