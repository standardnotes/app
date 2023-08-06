import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('payload manager', () => {
  let payloadManager
  let createNotePayload

  beforeEach(async function () {
    const logger = new Logger('test')
    payloadManager = new PayloadManager(logger)

    createNotePayload = async () => {
      return new DecryptedPayload({
        uuid: Factory.generateUuidish(),
        content_type: ContentType.TYPES.Note,
        content: {
          title: 'hello',
          text: 'world',
        },
      })
    }
  })

  it('emit payload should create local record', async function () {
    const payload = await createNotePayload()
    await payloadManager.emitPayload(payload)

    expect(payloadManager.collection.find(payload.uuid)).to.be.ok
  })

  it('merge payloads onto master', async function () {
    const payload = await createNotePayload()
    await payloadManager.emitPayload(payload)

    const newTitle = `${Math.random()}`
    const changedPayload = payload.copy({
      content: {
        ...payload.content,
        title: newTitle,
      },
    })
    const { changed, inserted } = await payloadManager.applyPayloads([changedPayload])
    expect(changed.length).to.equal(1)
    expect(inserted.length).to.equal(0)
    expect(payloadManager.collection.find(payload.uuid).content.title).to.equal(newTitle)
  })

  it('insertion observer', async function () {
    const observations = []
    payloadManager.addObserver(ContentType.TYPES.Any, ({ inserted }) => {
      observations.push({ inserted })
    })
    const payload = await createNotePayload()
    await payloadManager.emitPayload(payload)

    expect(observations.length).equal(1)
    expect(observations[0].inserted[0]).equal(payload)
  })

  it('change observer', async function () {
    const observations = []
    payloadManager.addObserver(ContentType.TYPES.Any, ({ changed }) => {
      if (changed.length > 0) {
        observations.push({ changed })
      }
    })
    const payload = await createNotePayload()
    await payloadManager.emitPayload(payload)
    await payloadManager.emitPayload(
      payload.copy({
        content: {
          ...payload.content,
          title: 'new title',
        },
      }),
    )

    expect(observations.length).equal(1)
    expect(observations[0].changed[0].uuid).equal(payload.uuid)
  })

  it('reset state', async function () {
    payloadManager.addObserver(ContentType.TYPES.Any, ({}) => {})
    const payload = await createNotePayload()
    await payloadManager.emitPayload(payload)
    await payloadManager.resetState()

    expect(payloadManager.collection.all().length).to.equal(0)
    expect(payloadManager.changeObservers.length).equal(1)
  })
})
