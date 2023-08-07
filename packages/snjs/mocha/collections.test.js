import * as Factory from './lib/factory.js'
import { createRelatedNoteTagPairPayload } from './lib/Items.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('payload collections', () => {
  beforeEach(async () => {
    localStorage.clear()
  })

  afterEach(async () => {
    localStorage.clear()
  })

  const copyNote = (note, timestamp, changeUuid) => {
    return new SNNote(
      note.payload.copy({
        uuid: changeUuid ? Factory.generateUuidish() : note.payload.uuid,
        created_at: timestamp ? new Date(timestamp) : new Date(),
      }),
    )
  }

  it('find', async () => {
    const payload = Factory.createNotePayload()
    const collection = ImmutablePayloadCollection.WithPayloads([payload])
    expect(collection.find(payload.uuid)).to.be.ok
  })

  it('references', async () => {
    const payloads = createRelatedNoteTagPairPayload()
    const notePayload = payloads[0]
    const tagPayload = payloads[1]
    const collection = ImmutablePayloadCollection.WithPayloads([notePayload, tagPayload])
    const referencing = collection.elementsReferencingElement(notePayload)
    expect(referencing.length).to.equal(1)
  })

  it('references by content type', async () => {
    const [notePayload1, tagPayload1] = createRelatedNoteTagPairPayload()
    const collection = ImmutablePayloadCollection.WithPayloads([notePayload1, tagPayload1])
    const referencingTags = collection.elementsReferencingElement(notePayload1, ContentType.TYPES.Tag)
    expect(referencingTags.length).to.equal(1)
    expect(referencingTags[0].uuid).to.equal(tagPayload1.uuid)

    const referencingNotes = collection.elementsReferencingElement(notePayload1, ContentType.TYPES.Note)
    expect(referencingNotes.length).to.equal(0)
  })

  it('conflict map', async () => {
    const payload = Factory.createNotePayload()
    const collection = new PayloadCollection()
    collection.set([payload])
    const conflict = payload.copy({
      content: {
        conflict_of: payload.uuid,
        ...payload.content,
      },
    })
    collection.set([conflict])

    expect(collection.conflictsOf(payload.uuid)).to.eql([conflict])

    const manualResults = collection.all().find((p) => {
      return p.content.conflict_of === payload.uuid
    })
    expect(collection.conflictsOf(payload.uuid)).to.eql([manualResults])
  })

  it('setting same element twice should not yield duplicates', async () => {
    const collection = new PayloadCollection()
    const payload = Factory.createNotePayload()

    const copy = payload.copy()
    collection.set([payload, copy])
    collection.set([payload])
    collection.set([payload, copy])

    const sorted = collection.all(ContentType.TYPES.Note)
    expect(sorted.length).to.equal(1)
  })
})
