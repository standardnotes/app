import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

const createBarePayload = () => {
  return new DecryptedPayload({
    uuid: '123',
    content_type: ContentType.TYPES.Note,
    content: {
      title: 'hello',
    },
  })
}

const createNote = () => {
  return new DecryptedItem(createBarePayload())
}

const createTag = (notes = []) => {
  const references = notes.map((note) => {
    return {
      uuid: note.uuid,
      content_type: note.content_type,
    }
  })

  return new SNTag(
    new DecryptedPayload({
      uuid: Factory.generateUuidish(),
      content_type: ContentType.TYPES.Tag,
      content: {
        title: 'thoughts',
        references: references,
      },
    }),
  )
}

describe('item', () => {
  it('constructing without uuid should throw', function () {
    let error

    try {
      new DecryptedItem({})
    } catch (e) {
      error = e
    }

    expect(error).to.be.ok
  })

  it('healthy constructor', function () {
    const item = createNote()

    expect(item).to.be.ok
    expect(item.payload).to.be.ok
  })

  it('user modified date should be ok', function () {
    const item = createNote()

    expect(item.userModifiedDate).to.be.ok
  })

  it('has relationship with item true', function () {
    const note = createNote()
    const tag = createTag()

    expect(tag.isReferencingItem(note)).to.equal(false)
  })

  it('has relationship with item true', function () {
    const note = createNote()
    const tag = createTag([note])

    expect(tag.isReferencingItem(note)).to.equal(true)
  })

  it('getDomainData for random domain should return undefined', function () {
    const note = createNote()

    expect(note.getDomainData('random')).to.not.be.ok
  })

  it('getDomainData for app domain should return object', function () {
    const note = createNote()

    expect(note.getDomainData(DecryptedItem.DefaultAppDomain())).to.be.ok
  })
})
