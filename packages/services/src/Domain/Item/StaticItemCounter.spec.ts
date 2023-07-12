import { ContentType } from '@standardnotes/domain-core'
import { SNNote, SNTag } from '@standardnotes/models'
import { StaticItemCounter } from './StaticItemCounter'

describe('ItemCounter', () => {
  const createCounter = () => new StaticItemCounter()

  it('should count distinct item counts', () => {
    const items = [
      {
        archived: true,
      } as jest.Mocked<SNNote>,
      {
        trashed: true,
      } as jest.Mocked<SNNote>,
      {
        archived: true,
        trashed: true,
      } as jest.Mocked<SNNote>,
      {
        content_type: ContentType.TYPES.Note,
      } as jest.Mocked<SNNote>,
      {
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>,
    ]

    expect(createCounter().countNotesAndTags(items)).toEqual({
      archived: 1,
      deleted: 2,
      notes: 1,
      tags: 1,
    })
  })
})
