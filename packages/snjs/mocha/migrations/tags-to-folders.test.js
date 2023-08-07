import * as Factory from '../lib/factory.js'

chai.use(chaiAsPromised)
const expect = chai.expect

const setupRandomUuid = () => {
  let currentId = 0

  UuidGenerator.SetGenerator(() => String(currentId++))
}

describe('web native folders migration', () => {
  let application

  beforeEach(async function () {
    localStorage.clear()
    application = await Factory.createInitAppWithFakeCrypto()
    setupRandomUuid()
  })

  afterEach(async function () {
    await Factory.safeDeinit(application)
    application = undefined
    localStorage.clear()
  })

  it('migration with flat tag folders', async function () {
    const titles = ['a', 'b', 'c']
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      a: { _uuid: 'a' },
      b: { _uuid: 'b' },
      c: { _uuid: 'c' },
    })
  })

  it('migration with simple tag folders', async function () {
    const titles = ['a.b.c', 'b', 'a.b']
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      a: {
        _uuid: '0',
        b: {
          _uuid: 'a.b',
          c: { _uuid: 'a.b.c' },
        },
      },
      b: { _uuid: 'b' },
    })
  })

  it('migration with more complex cases', async function () {
    const titles = ['a.b.c', 'b', 'a.b']
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      a: {
        _uuid: '0',
        b: {
          _uuid: 'a.b',
          c: { _uuid: 'a.b.c' },
        },
      },
      b: { _uuid: 'b' },
    })
  })

  it('should produce a valid hierarchy cases with  missing intermediate tags or unordered', async function () {
    const titles = ['y.2', 'w.3', 'y']
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      w: {
        _uuid: '0',
        3: {
          _uuid: 'w.3',
        },
      },
      y: { _uuid: 'y', 2: { _uuid: 'y.2' } },
    })
  })

  it('skip prefixed names', async function () {
    const titles = ['.something', '.something...something', 'something.a.b.c']
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      '.something': { _uuid: '.something' },
      '.something...something': { _uuid: '.something...something' },
      something: {
        _uuid: '0',
        a: { _uuid: '1', b: { _uuid: '2', c: { _uuid: 'something.a.b.c' } } },
      },
    })
  })

  it('skip not-supported names', async function () {
    const titles = [
      'something.',
      'something..',
      'something..another.thing',
      'a.b.c',
      'a',
      'something..another.thing..anyway',
    ]
    await makeTags(application, titles)

    // Run the migration
    await application.mutator.migrateTagsToFolders()

    // Check new tags
    const result = extractTagHierarchy(application)

    expect(result).to.deep.equal({
      'something.': { _uuid: 'something.' },
      'something..': { _uuid: 'something..' },
      'something..another.thing': { _uuid: 'something..another.thing' },
      'something..another.thing..anyway': {
        _uuid: 'something..another.thing..anyway',
      },
      a: {
        _uuid: 'a',
        b: {
          _uuid: '0',
          c: {
            _uuid: 'a.b.c',
          },
        },
      },
    })
  })
})

const makeTags = async (application, titles) => {
  const createTag = (title) => {
    return Factory.createMappedTag(application, { title, uuid: title })
  }

  const tags = await Promise.all(titles.map(createTag))
  return tags
}

const extractTagHierarchy = (application) => {
  const result = {}
  const roots = application.items.getRootTags()

  const constructHierarchy = (currentTag, result) => {
    result[currentTag.title] = { _uuid: currentTag.uuid }

    const children = application.items.getTagChildren(currentTag)

    children.forEach((child) => {
      constructHierarchy(child, result[currentTag.title])
    })
  }

  roots.forEach((tag) => {
    constructHierarchy(tag, result)
  })

  return result
}
