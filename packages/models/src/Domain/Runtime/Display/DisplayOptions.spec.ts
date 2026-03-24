import { createNoteWithContent } from '../../Utilities/Test/SpecUtils'
import { ItemCollection } from '../Collection/Item/ItemCollection'
import { SNNote } from '../../Syncable/Note/Note'
import { notesAndFilesMatchingOptions } from './Search/SearchUtilities'
import { NotesAndFilesDisplayOptions } from './DisplayOptions'

describe('item display options', () => {
  const collectionWithNotes = function (titles: (string | undefined)[] = [], bodies: string[] = []) {
    const collection = new ItemCollection()
    const notes: SNNote[] = []
    titles.forEach((title, index) => {
      notes.push(
        createNoteWithContent({
          title: title,
          text: bodies[index],
        }),
      )
    })
    collection.set(notes)
    return collection
  }

  it('string query title', () => {
    const query = 'foo'

    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['hello', 'fobar', 'foobar', 'foo'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('string query text', async function () {
    const query = 'foo'
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(
      [undefined, undefined, undefined, undefined],
      ['hello', 'fobar', 'foobar', 'foo'],
    )
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('string query title and text', async function () {
    const query = 'foo'
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['hello', 'foobar'], ['foo', 'fobar'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('multi-word query matches when all words present', () => {
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: 'meeting notes', includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['Meeting Notes Monday', 'Notes', 'Meeting Agenda', 'notes from meeting'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('quoted query matches exact phrase only', () => {
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: '"foo bar"', includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['foo bar', 'bar foo', 'foo baz bar', 'foo bar baz'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('case insensitive matching', () => {
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: 'HELLO', includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['hello world', 'Hello', 'goodbye'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('empty query returns all items', () => {
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: '', includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['one', 'two', 'three'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(3)
  })
})
