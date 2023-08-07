import * as Factory from './lib/factory.js'
import { createRelatedNoteTagPairPayload } from './lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('payload encryption', function () {
  let application

  beforeEach(async function () {
    this.timeout(Factory.TenSecondTimeout)
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    localStorage.clear()
    application = undefined
  })

  it('creating payload from item should create copy not by reference', async function () {
    const item = await Factory.createMappedNote(application)
    const payload = new DecryptedPayload(item.payload.ejected())
    expect(item.content === payload.content).to.equal(false)
    expect(item.content.references === payload.content.references).to.equal(false)
  })

  it('creating payload from item should preserve appData', async function () {
    const item = await Factory.createMappedNote(application)
    const payload = new DecryptedPayload(item.payload.ejected())
    expect(item.content.appData).to.be.ok
    expect(JSON.stringify(item.content)).to.equal(JSON.stringify(payload.content))
  })

  it('server payloads should not contain client values', async function () {
    const rawPayload = Factory.createNotePayload()
    const notePayload = new DecryptedPayload({
      ...rawPayload,
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
      lastSyncBegan: new Date(),
    })

    const encryptedPayload = await application.encryption.encryptSplitSingle({
      usesItemsKeyWithKeyLookup: {
        items: [notePayload],
      },
    })

    const syncPayload = CreateEncryptedServerSyncPushPayload(encryptedPayload)

    expect(syncPayload.dirty).to.not.be.ok
    expect(syncPayload.errorDecrypting).to.not.be.ok
    expect(syncPayload.waitingForKey).to.not.be.ok
    expect(syncPayload.lastSyncBegan).to.not.be.ok
  })

  it('creating payload with override properties', function () {
    const payload = Factory.createNotePayload()
    const uuid = payload.uuid
    const changedUuid = 'foo'
    const changedPayload = new DecryptedPayload({
      ...payload,
      uuid: changedUuid,
    })

    expect(payload.uuid).to.equal(uuid)
    expect(changedPayload.uuid).to.equal(changedUuid)
  })

  it('creating payload with deep override properties', function () {
    const payload = Factory.createNotePayload()
    const text = payload.content.text
    const changedText = `${Math.random()}`
    const changedPayload = new DecryptedPayload({
      ...payload,
      content: {
        ...payload.content,
        text: changedText,
      },
    })

    expect(payload.content === changedPayload.content).to.equal(false)
    expect(payload.content.text).to.equal(text)
    expect(changedPayload.content.text).to.equal(changedText)
  })

  it('copying payload with override content should override completely', async function () {
    const item = await Factory.createMappedNote(application)
    const payload = new DecryptedPayload(item.payload.ejected())
    const mutated = new DecryptedPayload({
      ...payload,
      content: {
        foo: 'bar',
      },
    })
    expect(mutated.content.text).to.not.be.ok
  })

  it('copying payload with override should copy empty arrays', function () {
    const pair = createRelatedNoteTagPairPayload()
    const tagPayload = pair[1]
    expect(tagPayload.content.references.length).to.equal(1)

    const mutated = new DecryptedPayload({
      ...tagPayload,
      content: {
        ...tagPayload.content,
        references: [],
      },
    })
    expect(mutated.content.references.length).to.equal(0)
  })

  it('returns valid encrypted params for syncing', async function () {
    const payload = Factory.createNotePayload()
    const encryptedPayload = CreateEncryptedServerSyncPushPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )
    expect(encryptedPayload.enc_item_key).to.be.ok
    expect(encryptedPayload.uuid).to.be.ok
    expect(encryptedPayload.auth_hash).to.not.be.ok
    expect(encryptedPayload.content_type).to.be.ok
    expect(encryptedPayload.created_at).to.be.ok
    expect(encryptedPayload.content).to.satisfy((string) => {
      return string.startsWith(application.encryption.getLatestVersion())
    })
  }).timeout(5000)

  it('returns additional fields for local storage', async function () {
    const payload = Factory.createNotePayload()

    const encryptedPayload = CreateEncryptedLocalStorageContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )

    expect(encryptedPayload.enc_item_key).to.be.ok
    expect(encryptedPayload.auth_hash).to.not.be.ok
    expect(encryptedPayload.uuid).to.be.ok
    expect(encryptedPayload.content_type).to.be.ok
    expect(encryptedPayload.created_at).to.be.ok
    expect(encryptedPayload.updated_at).to.be.ok
    expect(encryptedPayload.deleted).to.not.be.ok
    expect(encryptedPayload.errorDecrypting).to.not.be.ok
    expect(encryptedPayload.content).to.satisfy((string) => {
      return string.startsWith(application.encryption.getLatestVersion())
    })
  })

  it('omits deleted for export file', async function () {
    const payload = Factory.createNotePayload()
    const encryptedPayload = CreateEncryptedBackupFileContextPayload(
      await application.encryption.encryptSplitSingle({
        usesItemsKeyWithKeyLookup: {
          items: [payload],
        },
      }),
    )

    expect(encryptedPayload.enc_item_key).to.be.ok
    expect(encryptedPayload.uuid).to.be.ok
    expect(encryptedPayload.content_type).to.be.ok
    expect(encryptedPayload.created_at).to.be.ok
    expect(encryptedPayload.deleted).to.not.be.ok
    expect(encryptedPayload.content).to.satisfy((string) => {
      return string.startsWith(application.encryption.getLatestVersion())
    })
  })

  it('items with error decrypting should remain as is', async function () {
    const payload = Factory.createNotePayload()
    const mutatedPayload = new EncryptedPayload({
      ...payload,
      content: '004:...',
      enc_item_key: 'foo',
      errorDecrypting: true,
    })

    const syncPayload = CreateEncryptedServerSyncPushPayload(mutatedPayload)

    expect(syncPayload.content).to.eql(mutatedPayload.content)
    expect(syncPayload.enc_item_key).to.be.ok
    expect(syncPayload.uuid).to.be.ok
    expect(syncPayload.content_type).to.be.ok
    expect(syncPayload.created_at).to.be.ok
  })
})
