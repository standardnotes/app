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

  it('matches notes whose title contains the search query', () => {
    const query = 'foo'

    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['hello', 'fobar', 'foobar', 'foo'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('matches notes whose body contains the search query', () => {
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

  it('matches notes when the search query appears in either title or body', () => {
    const query = 'foo'
    const options: NotesAndFilesDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    } as jest.Mocked<NotesAndFilesDisplayOptions>
    const collection = collectionWithNotes(['hello', 'foobar'], ['foo', 'fobar'])
    expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  describe('title-only search', () => {
    it('matches notes when the query appears only in the title', () => {
      const query = 'foo'
      const options: NotesAndFilesDisplayOptions = {
        searchQuery: { query, includeProtectedNoteText: true, noteTitleOnly: true },
      } as jest.Mocked<NotesAndFilesDisplayOptions>
      const collection = collectionWithNotes(['foo', 'hello', 'foobar'], ['bar', 'baz', 'qux'])
      expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
    })

    it('does not match notes when the query appears only in the body', () => {
      const query = 'foo'
      const options: NotesAndFilesDisplayOptions = {
        searchQuery: { query, includeProtectedNoteText: true, noteTitleOnly: true },
      } as jest.Mocked<NotesAndFilesDisplayOptions>
      const collection = collectionWithNotes(['hello', 'world'], ['foo', 'foobar'])
      expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(0)
    })

    it('matches notes with a matching title even when the query also appears in the body', () => {
      const query = 'foo'
      const options: NotesAndFilesDisplayOptions = {
        searchQuery: { query, includeProtectedNoteText: true, noteTitleOnly: true },
      } as jest.Mocked<NotesAndFilesDisplayOptions>
      const collection = collectionWithNotes(['foo', 'hello', 'foobar'], ['bar', 'foo', 'foo'])
      expect(notesAndFilesMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
    })
  })
})
