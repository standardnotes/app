import { createNoteWithContent } from '../../Utilities/Test/SpecUtils'
import { ItemCollection } from '../Collection/Item/ItemCollection'
import { SNNote } from '../../Syncable/Note/Note'
import { itemsMatchingOptions } from './Search/SearchUtilities'
import { FilterDisplayOptions } from './DisplayOptions'

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

    const options: FilterDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    }
    const collection = collectionWithNotes(['hello', 'fobar', 'foobar', 'foo'])
    expect(itemsMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('string query text', async function () {
    const query = 'foo'
    const options: FilterDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    }
    const collection = collectionWithNotes(
      [undefined, undefined, undefined, undefined],
      ['hello', 'fobar', 'foobar', 'foo'],
    )
    expect(itemsMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })

  it('string query title and text', async function () {
    const query = 'foo'
    const options: FilterDisplayOptions = {
      searchQuery: { query: query, includeProtectedNoteText: true },
    }
    const collection = collectionWithNotes(['hello', 'foobar'], ['foo', 'fobar'])
    expect(itemsMatchingOptions(options, collection.all() as SNNote[], collection)).toHaveLength(2)
  })
})
