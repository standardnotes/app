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
})
