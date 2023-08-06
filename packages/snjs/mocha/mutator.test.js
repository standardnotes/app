import * as Factory from './lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

describe('item mutator', () => {
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

  it('mutate set domain data key', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.setDomainDataKey('somekey', 'somevalue', 'somedomain')
    const payload = mutator.getResult()

    expect(payload.content.appData.somedomain.somekey).to.equal('somevalue')
  })

  it('mutate set pinned', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.pinned = true
    const payload = mutator.getResult()

    expect(payload.content.appData[DecryptedItem.DefaultAppDomain()].pinned).to.equal(true)
  })

  it('mutate set archived', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.archived = true
    const payload = mutator.getResult()

    expect(payload.content.appData[DecryptedItem.DefaultAppDomain()].archived).to.equal(true)
  })

  it('mutate set locked', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.locked = true
    const payload = mutator.getResult()

    expect(payload.content.appData[DecryptedItem.DefaultAppDomain()].locked).to.equal(true)
  })

  it('mutate set protected', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.protected = true
    const payload = mutator.getResult()

    expect(payload.content.protected).to.equal(true)
  })

  it('mutate set trashed', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    mutator.trashed = true
    const payload = mutator.getResult()

    expect(payload.content.trashed).to.equal(true)
  })

  it('calling get result should set us dirty', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    const payload = mutator.getResult()

    expect(payload.dirty).to.equal(true)
  })

  it('get result should always have userModifiedDate', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item)
    const payload = mutator.getResult()
    const resultItem = CreateDecryptedItemFromPayload(payload)
    expect(resultItem.userModifiedDate).to.be.ok
  })

  it('mutate set deleted', function () {
    const item = createNote()
    const mutator = new DeleteItemMutator(item)
    const payload = mutator.getDeletedResult()

    expect(payload.content).to.not.be.ok
    expect(payload.deleted).to.equal(true)
    expect(payload.dirty).to.equal(true)
  })

  it('mutate app data', function () {
    const item = createNote()
    const mutator = new DecryptedItemMutator(item, MutationType.UpdateUserTimestamps)
    mutator.setAppDataItem('foo', 'bar')
    mutator.setAppDataItem('bar', 'foo')
    const payload = mutator.getResult()
    expect(payload.content.appData[DecryptedItem.DefaultAppDomain()].foo).to.equal('bar')
    expect(payload.content.appData[DecryptedItem.DefaultAppDomain()].bar).to.equal('foo')
  })

  it('mutate add item as relationship', function () {
    const note = createNote()
    const tag = createTag()
    const mutator = new DecryptedItemMutator(tag)
    mutator.e2ePendingRefactor_addItemAsRelationship(note)
    const payload = mutator.getResult()

    const item = new DecryptedItem(payload)
    expect(item.isReferencingItem(note)).to.equal(true)
  })

  it('mutate remove item as relationship', function () {
    const note = createNote()
    const tag = createTag([note])
    const mutator = new DecryptedItemMutator(tag)
    mutator.removeItemAsRelationship(note)
    const payload = mutator.getResult()

    const item = new DecryptedItem(payload)
    expect(item.isReferencingItem(note)).to.equal(false)
  })
})
