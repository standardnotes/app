import { prepareSearchQuery, itemMatchesQuery, itemMatchesQueryPrepared } from './SearchUtilities'
import { createNoteWithContent } from '../../../Utilities/Test/SpecUtils'
import { ItemCollection } from '../../Collection/Item/ItemCollection'
import { SNNote } from '../../../Syncable/Note/Note'
import { SearchQuery } from './Types'

describe('prepareSearchQuery', () => {
  it('lowercases the query', () => {
    const prepared = prepareSearchQuery('Hello World')
    expect(prepared.lowercase).toBe('hello world')
  })

  it('splits into words', () => {
    const prepared = prepareSearchQuery('foo bar baz')
    expect(prepared.words).toEqual(['foo', 'bar', 'baz'])
  })

  it('extracts quoted text', () => {
    const prepared = prepareSearchQuery('"exact phrase"')
    expect(prepared.quotedText).toBe('exact phrase')
  })

  it('returns null for quotedText when no quotes', () => {
    const prepared = prepareSearchQuery('no quotes here')
    expect(prepared.quotedText).toBeNull()
  })

  it('detects uuid strings', () => {
    const prepared = prepareSearchQuery('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
    expect(prepared.isUuid).toBe(true)
  })

  it('does not flag non-uuid as uuid', () => {
    const prepared = prepareSearchQuery('not-a-uuid')
    expect(prepared.isUuid).toBe(false)
  })

  it('preserves raw string', () => {
    const prepared = prepareSearchQuery('FooBar')
    expect(prepared.raw).toBe('FooBar')
  })

  it('handles empty string', () => {
    const prepared = prepareSearchQuery('')
    expect(prepared.raw).toBe('')
    expect(prepared.words).toEqual([''])
    expect(prepared.quotedText).toBeNull()
    expect(prepared.isUuid).toBe(false)
  })
})

describe('itemMatchesQuery', () => {
  const makeCollection = (notes: SNNote[]) => {
    const collection = new ItemCollection()
    collection.set(notes)
    return collection
  }

  it('matches title with multi-word query', () => {
    const note = createNoteWithContent({ title: 'Meeting Notes for Monday', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: 'meeting monday', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(true)
  })

  it('does not match when only some words are present', () => {
    const note = createNoteWithContent({ title: 'Meeting Notes', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: 'meeting friday', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(false)
  })

  it('matches body text', () => {
    const note = createNoteWithContent({ title: '', text: 'some important content here' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: 'important', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(true)
  })

  it('matches quoted exact phrase', () => {
    const note = createNoteWithContent({ title: 'hello world foo', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: '"world foo"', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(true)
  })

  it('does not match quoted phrase when words are not adjacent', () => {
    const note = createNoteWithContent({ title: 'world bar foo', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: '"world foo"', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(false)
  })

  it('empty query matches everything', () => {
    const note = createNoteWithContent({ title: 'anything', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: '', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(true)
  })

  it('is case insensitive', () => {
    const note = createNoteWithContent({ title: 'UPPERCASE TITLE', text: '' })
    const collection = makeCollection([note])
    const query: SearchQuery = { query: 'uppercase', includeProtectedNoteText: true }

    expect(itemMatchesQuery(note, query, collection)).toBe(true)
  })
})

describe('itemMatchesQueryPrepared', () => {
  const makeCollection = (notes: SNNote[]) => {
    const collection = new ItemCollection()
    collection.set(notes)
    return collection
  }

  // belt and suspenders - make sure prepared gives identical results
  it('produces same results as itemMatchesQuery', () => {
    const notes = [
      createNoteWithContent({ title: 'Meeting Notes', text: 'discuss budget' }),
      createNoteWithContent({ title: 'Grocery List', text: 'milk eggs bread' }),
      createNoteWithContent({ title: 'Random', text: 'meeting prep' }),
    ]
    const collection = makeCollection(notes)
    const query: SearchQuery = { query: 'meeting', includeProtectedNoteText: true }
    const prepared = prepareSearchQuery(query.query)

    for (const note of notes) {
      expect(itemMatchesQueryPrepared(note, query, prepared, collection)).toBe(
        itemMatchesQuery(note, query, collection),
      )
    }
  })

  it('reuses prepared query across multiple items', () => {
    const notes = [
      createNoteWithContent({ title: 'alpha', text: '' }),
      createNoteWithContent({ title: 'beta', text: '' }),
      createNoteWithContent({ title: 'alpha beta', text: '' }),
    ]
    const collection = makeCollection(notes)
    const query: SearchQuery = { query: 'alpha', includeProtectedNoteText: true }
    const prepared = prepareSearchQuery(query.query)

    const results = notes.filter((n) => itemMatchesQueryPrepared(n, query, prepared, collection))
    expect(results).toHaveLength(2)
  })
})
