/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('payload manager', () => {
  beforeEach(async function () {
    this.payloadManager = new PayloadManager()
    this.createNotePayload = async () => {
      return new DecryptedPayload({
        uuid: Factory.generateUuidish(),
        content_type: ContentType.Note,
        content: {
          title: 'hello',
          text: 'world',
        },
      })
    }
  })

  it('emit payload should create local record', async function () {
    const payload = await this.createNotePayload()
    await this.payloadManager.emitPayload(payload)

    expect(this.payloadManager.collection.find(payload.uuid)).to.be.ok
  })

  it('merge payloads onto master', async function () {
    const payload = await this.createNotePayload()
    await this.payloadManager.emitPayload(payload)

    const newTitle = `${Math.random()}`
    const changedPayload = payload.copy({
      content: {
        ...payload.content,
        title: newTitle,
      },
    })
    const { changed, inserted } = await this.payloadManager.applyPayloads([changedPayload])
    expect(changed.length).to.equal(1)
    expect(inserted.length).to.equal(0)
    expect(this.payloadManager.collection.find(payload.uuid).content.title).to.equal(newTitle)
  })

  it('insertion observer', async function () {
    const observations = []
    this.payloadManager.addObserver(ContentType.Any, ({ inserted }) => {
      observations.push({ inserted })
    })
    const payload = await this.createNotePayload()
    await this.payloadManager.emitPayload(payload)

    expect(observations.length).equal(1)
    expect(observations[0].inserted[0]).equal(payload)
  })

  it('change observer', async function () {
    const observations = []
    this.payloadManager.addObserver(ContentType.Any, ({ changed }) => {
      if (changed.length > 0) {
        observations.push({ changed })
      }
    })
    const payload = await this.createNotePayload()
    await this.payloadManager.emitPayload(payload)
    await this.payloadManager.emitPayload(
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
    this.payloadManager.addObserver(ContentType.Any, ({}) => {})
    const payload = await this.createNotePayload()
    await this.payloadManager.emitPayload(payload)
    await this.payloadManager.resetState()

    expect(this.payloadManager.collection.all().length).to.equal(0)
    expect(this.payloadManager.changeObservers.length).equal(1)
  })
})
