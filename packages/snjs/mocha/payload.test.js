import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('payload', () => {
  const createBarePayload = () => {
    return new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      content: {
        title: 'hello',
      },
    })
  }

  const createEncryptedPayload = () => {
    return new EncryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      content: '004:foo:bar',
    })
  }

  it('constructor should set expected fields', function () {
    const payload = createBarePayload()

    expect(payload.uuid).to.be.ok
    expect(payload.content_type).to.be.ok
    expect(payload.content).to.be.ok
  })

  it('not supplying source should default to constructor source', function () {
    const payload = new DecryptedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      content: {
        title: 'hello',
      },
    })

    expect(payload.source).to.equal(PayloadSource.Constructor)
  })

  it('created at should default to present', function () {
    const payload = createBarePayload()

    expect(payload.created_at - new Date()).to.be.below(1)
  })

  it('updated at should default to epoch', function () {
    const payload = createBarePayload()

    expect(payload.updated_at.getTime()).to.equal(0)
  })

  it('payload format bare', function () {
    const payload = createBarePayload()

    expect(isDecryptedPayload(payload)).to.equal(true)
  })

  it('payload format encrypted string', function () {
    const payload = createEncryptedPayload()

    expect(isEncryptedPayload(payload)).to.equal(true)
  })

  it('payload with unrecognized prefix should be corrupt', async function () {
    await Factory.expectThrowsAsync(
      () =>
        new EncryptedPayload({
          uuid: '123',
          content_type: ContentType.TYPES.Note,
          content: '000:somebase64string',
        }),
      'EncryptedPayload constructor versionResult is failed',
    )
  })

  it('payload format deleted', function () {
    const payload = new DeletedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      deleted: true,
    })

    expect(isDeletedPayload(payload)).to.equal(true)
  })

  it('payload version 004', function () {
    const payload = createEncryptedPayload()

    expect(payload.version).to.equal('004')
  })

  it('merged with absent content', function () {
    const payload = createBarePayload()
    const merged = payload.copy({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      updated_at: new Date(),
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
    })

    expect(merged.content).to.eql(payload.content)
    expect(merged.uuid).to.equal(payload.uuid)
    expect(merged.dirty).to.equal(true)
    expect(merged.updated_at.getTime()).to.be.above(1)
  })

  it('deleted and not dirty should be discardable', function () {
    const payload = new DeletedPayload({
      uuid: '123',
      content_type: ContentType.TYPES.Note,
      deleted: true,
      dirty: false,
    })

    expect(payload.discardable).to.equal(true)
  })

  it('should be immutable', async function () {
    const payload = createBarePayload()

    await Factory.sleep(0.1)

    const changeFn = () => {
      payload.foo = 'bar'
    }
    expect(changeFn).to.throw()
  })
})
