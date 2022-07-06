/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('protocol', function () {
  beforeEach(async function () {
    localStorage.clear()
    this.application = await Factory.createInitAppWithFakeCrypto()
    this.email = UuidGenerator.GenerateUuid()
    this.password = UuidGenerator.GenerateUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(this.application)
    this.application = null
    localStorage.clear()
  })

  it('checks version to make sure its 004', function () {
    expect(this.application.protocolService.getLatestVersion()).to.equal('004')
  })

  it('checks supported versions to make sure it includes 001, 002, 003, 004', function () {
    expect(this.application.protocolService.supportedVersions()).to.eql(['001', '002', '003', '004'])
  })

  it('platform derivation support', function () {
    expect(
      this.application.protocolService.platformSupportsKeyDerivation({
        version: '001',
      }),
    ).to.equal(true)
    expect(
      this.application.protocolService.platformSupportsKeyDerivation({
        version: '002',
      }),
    ).to.equal(true)
    expect(
      this.application.protocolService.platformSupportsKeyDerivation({
        version: '003',
      }),
    ).to.equal(true)
    expect(
      this.application.protocolService.platformSupportsKeyDerivation({
        version: '004',
      }),
    ).to.equal(true)
    expect(
      this.application.protocolService.platformSupportsKeyDerivation({
        version: '005',
      }),
    ).to.equal(true)
  })

  it('key params versions <= 002 should include pw_cost in portable value', function () {
    const keyParams002 = this.application.protocolService.createKeyParams({
      version: '002',
      pw_cost: 5000,
    })
    expect(keyParams002.getPortableValue().pw_cost).to.be.ok
  })

  it('version comparison of 002 should be older than library version', function () {
    expect(this.application.protocolService.isVersionNewerThanLibraryVersion('002')).to.equal(false)
  })

  it('version comparison of 005 should be newer than library version', function () {
    expect(this.application.protocolService.isVersionNewerThanLibraryVersion('005')).to.equal(true)
  })

  it('library version should not be outdated', function () {
    var currentVersion = this.application.protocolService.getLatestVersion()
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
      await this.application.protocolService.decryptSplitSingle({
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
    await this.application.addPasscode('123')
    const payload = Factory.createNotePayload()
    const result = CreateEncryptedServerSyncPushPayload(
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
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
      await this.application.protocolService.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload).to.be.ok
    expect(encryptedPayload).to.contain.keys('duplicate_of')
  })
})
