import { ContentType } from '@standardnotes/domain-core'
import { getItemTitleInContextOfLinkBubble, doesItemMatchSearchQuery } from './doesItemMatchSearchQuery'
import { DecryptedItemInterface, ItemContent, SNNote, SNTag, isNote, isTag } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

describe('getItemTitleInContextOfLinkBubble', () => {
  it('returns the title if present', () => {
    const item = { title: 'Test Title', content_type: ContentType.TYPES.Note } as jest.Mocked<SNNote>
    expect(getItemTitleInContextOfLinkBubble(item as DecryptedItemInterface<ItemContent>)).toBe('Test Title')
  })

  it('returns the note preview if title is empty and item is a note', () => {
    const item = {
      preview_plain: 'Note Preview',
      title: '',
      content_type: ContentType.TYPES.Note,
    } as jest.Mocked<SNNote>
    expect(getItemTitleInContextOfLinkBubble(item as DecryptedItemInterface<ItemContent>)).toBe('Note Preview')
  })

  it('returns empty string if title is empty and item is not a note', () => {
    const item = { title: '', content_type: ContentType.TYPES.Tag } as jest.Mocked<SNNote>
    expect(getItemTitleInContextOfLinkBubble(item as DecryptedItemInterface<ItemContent>)).toBe('')
  })
})

describe('doesItemMatchSearchQuery', () => {
  const application = {} as WebApplicationInterface

  it('returns false for a protected note even if the title matches the search query', () => {
    const item = {
      title: '',
      preview_plain: 'Protected Note Content',
      protected: true,
      archived: false,
      trashed: false,
      content_type: ContentType.TYPES.Note,
    } as jest.Mocked<SNNote>
    expect(
      doesItemMatchSearchQuery(item as DecryptedItemInterface<ItemContent>, 'protected note content', application),
    ).toBeFalsy()
  })

  it('returns true if the item title matches the search query', () => {
    const item = { title: 'Matched Item', archived: false, trashed: false }
    expect(doesItemMatchSearchQuery(item as DecryptedItemInterface<ItemContent>, 'matched', application)).toBeTruthy()
  })

  it('returns false if the item is archived', () => {
    const item = { title: 'Archived Item', archived: true, trashed: false }
    expect(doesItemMatchSearchQuery(item as DecryptedItemInterface<ItemContent>, 'archived', application)).toBeFalsy()
  })

  it('returns false if the item is trashed', () => {
    const item = { title: 'Trashed Item', archived: false, trashed: true }
    expect(doesItemMatchSearchQuery(item as DecryptedItemInterface<ItemContent>, 'trashed', application)).toBeFalsy()
  })
})
