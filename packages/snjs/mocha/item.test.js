/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import * as Factory from './lib/factory.js'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('item', () => {
  beforeEach(async function () {
    this.createBarePayload = () => {
      return new DecryptedPayload({
        uuid: '123',
        content_type: ContentType.Note,
        content: {
          title: 'hello',
        },
      })
    }

    this.createNote = () => {
      return new DecryptedItem(this.createBarePayload())
    }

    this.createTag = (notes = []) => {
      const references = notes.map((note) => {
        return {
          uuid: note.uuid,
          content_type: note.content_type,
        }
      })
      return new SNTag(
        new DecryptedPayload({
          uuid: Factory.generateUuidish(),
          content_type: ContentType.Tag,
          content: {
            title: 'thoughts',
            references: references,
          },
        }),
      )
    }
  })

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
    const item = this.createNote()

    expect(item).to.be.ok
    expect(item.payload).to.be.ok
  })

  it('user modified date should be ok', function () {
    const item = this.createNote()

    expect(item.userModifiedDate).to.be.ok
  })

  it('has relationship with item true', function () {
    const note = this.createNote()
    const tag = this.createTag()

    expect(tag.isReferencingItem(note)).to.equal(false)
  })

  it('has relationship with item true', function () {
    const note = this.createNote()
    const tag = this.createTag([note])

    expect(tag.isReferencingItem(note)).to.equal(true)
  })

  it('getDomainData for random domain should return undefined', function () {
    const note = this.createNote()

    expect(note.getDomainData('random')).to.not.be.ok
  })

  it('getDomainData for app domain should return object', function () {
    const note = this.createNote()

    expect(note.getDomainData(DecryptedItem.DefaultAppDomain())).to.be.ok
  })
})
