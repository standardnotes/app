import { ContentType } from '@standardnotes/common'
import { SNNote, SNTag } from '@standardnotes/models'
import { ItemCounter } from './ItemCounter'

describe('ItemCounter', () => {
  const createCounter = () => new ItemCounter()

  it('should count distinct item counts', () => {
    const items = [
      {
        archived: true,
      } as jest.Mocked<SNNote>,
      {
        trashed: true,
      } as jest.Mocked<SNNote>,
      {
        content_type: ContentType.Note,
      } as jest.Mocked<SNNote>,
      {
        content_type: ContentType.Tag,
      } as jest.Mocked<SNTag>,
    ]

    expect(createCounter().countNotesAndTags(items)).toEqual({
      archived: 1,
      deleted: 1,
      notes: 1,
      tags: 1,
    })
  })
})
