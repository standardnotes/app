import { SNNote } from '@standardnotes/models'
import { SimplenoteConverter } from './SimplenoteConverter'
import data from './testData'
import { ContentType } from '@standardnotes/domain-core'
import { InsertNoteFn } from '../Converter'

describe('SimplenoteConverter', () => {
  const createNote: InsertNoteFn = async ({ title, text, trashed, createdAt, updatedAt }) =>
    ({
      uuid: Math.random().toString(),
      created_at: createdAt,
      updated_at: updatedAt,
      content_type: ContentType.TYPES.Note,
      content: {
        title,
        text,
        trashed,
        references: [],
      },
    }) as unknown as SNNote

  it('should parse', async () => {
    const converter = new SimplenoteConverter()

    const result = await converter.parse(data, createNote)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)

    expect(result?.[0].created_at).toBeInstanceOf(Date)
    expect(result?.[0].updated_at).toBeInstanceOf(Date)
    expect(result?.[0].uuid).not.toBeNull()
    expect(result?.[0].content_type).toBe('Note')
    expect(result?.[0].content.title).toBe('Testing 1')
    expect(result?.[0].content.text).toBe("This is the 1st note's content.")
    expect(result?.[0].content.trashed).toBe(false)

    expect(result?.[1].created_at).toBeInstanceOf(Date)
    expect(result?.[1].updated_at).toBeInstanceOf(Date)
    expect(result?.[1].uuid).not.toBeNull()
    expect(result?.[1].content_type).toBe('Note')
    expect(result?.[1].content.title).toBe('Testing 2')
    expect(result?.[1].content.text).toBe("This is...\r\nthe 2nd note's content.")
    expect(result?.[1].content.trashed).toBe(false)

    expect(result?.[2].created_at).toBeInstanceOf(Date)
    expect(result?.[2].updated_at).toBeInstanceOf(Date)
    expect(result?.[2].uuid).not.toBeNull()
    expect(result?.[2].content_type).toBe('Note')
    expect(result?.[2].content.title).not.toBeFalsy()
    expect(result?.[2].content.text).toBe('Welcome to Simplenote!')
    expect(result?.[2].content.trashed).toBe(true)
  })
})
