import { SortLeftFirst, SortRightFirst, sortTwoItems } from './SortTwoItems'
import { createNoteWithContent } from '../../Utilities/Test/SpecUtils'
import { SNNote } from '../../Syncable/Note'

describe('sort two items', () => {
  it('should sort correctly by dates', () => {
    const noteA = createNoteWithContent({}, new Date(0))
    const noteB = createNoteWithContent({}, new Date(1))

    expect(sortTwoItems(noteA, noteB, 'created_at', 'asc')).toEqual(SortLeftFirst)
    expect(sortTwoItems(noteA, noteB, 'created_at', 'dsc')).toEqual(SortRightFirst)
  })

  it('should sort by title', () => {
    const noteA = createNoteWithContent({ title: 'a' })
    const noteB = createNoteWithContent({ title: 'b' })

    expect(sortTwoItems(noteA, noteB, 'title', 'asc')).toEqual(SortLeftFirst)
    expect(sortTwoItems(noteA, noteB, 'title', 'dsc')).toEqual(SortRightFirst)
  })

  it('should sort correctly by title and pinned', () => {
    const noteA = createNoteWithContent({ title: 'a' })
    const noteB = { ...createNoteWithContent({ title: 'b' }), pinned: true } as jest.Mocked<SNNote>

    expect(sortTwoItems(noteA, noteB, 'title', 'asc')).toEqual(SortRightFirst)
    expect(sortTwoItems(noteA, noteB, 'title', 'dsc')).toEqual(SortRightFirst)
  })
})
