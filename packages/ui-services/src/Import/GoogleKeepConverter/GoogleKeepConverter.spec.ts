/**
 * @jest-environment jsdom
 */

import { jsonTextContentData, htmlTestData, jsonListContentData } from './testData'
import { GoogleKeepConverter } from './GoogleKeepConverter'
import { ContentType, SNNote } from '@standardnotes/snjs'
import { InsertNoteFn } from '../Converter'

describe('GoogleKeepConverter', () => {
  const insertNote: InsertNoteFn = async ({ title, text, createdAt, updatedAt, trashed, archived, pinned }) =>
    ({
      uuid: Math.random().toString(),
      created_at: createdAt,
      updated_at: updatedAt,
      content_type: ContentType.TYPES.Note,
      content: {
        title,
        text,
        trashed,
        archived,
        pinned,
        references: [],
      },
    }) as unknown as SNNote

  it('should parse json data', async () => {
    const converter = new GoogleKeepConverter()

    const textContent = await converter.tryParseAsJson(jsonTextContentData, insertNote, (md) => md)

    expect(textContent).not.toBeNull()
    expect(textContent?.created_at).toBeInstanceOf(Date)
    expect(textContent?.updated_at).toBeInstanceOf(Date)
    expect(textContent?.uuid).not.toBeNull()
    expect(textContent?.content_type).toBe('Note')
    expect(textContent?.content.title).toBe('Testing 1')
    expect(textContent?.content.text).toBe('This is a test.')
    expect(textContent?.content.trashed).toBe(false)
    expect(textContent?.content.archived).toBe(false)
    expect(textContent?.content.pinned).toBe(false)

    const listContent = await converter.tryParseAsJson(jsonListContentData, insertNote, (md) => md)

    expect(listContent).not.toBeNull()
    expect(listContent?.created_at).toBeInstanceOf(Date)
    expect(listContent?.updated_at).toBeInstanceOf(Date)
    expect(listContent?.uuid).not.toBeNull()
    expect(listContent?.content_type).toBe('Note')
    expect(listContent?.content.title).toBe('Testing 1')
    expect(listContent?.content.text).toBe('- [ ] Test 1\n- [x] Test 2')
    expect(textContent?.content.trashed).toBe(false)
    expect(textContent?.content.archived).toBe(false)
    expect(textContent?.content.pinned).toBe(false)
  })

  it('should parse html data', async () => {
    const converter = new GoogleKeepConverter()

    const result = await converter.tryParseAsHtml(
      htmlTestData,
      {
        name: 'note-2.html',
      },
      insertNote,
      (html) => html,
      false,
    )

    expect(result).not.toBeNull()
    expect(result?.created_at).toBeInstanceOf(Date)
    expect(result?.updated_at).toBeInstanceOf(Date)
    expect(result?.uuid).not.toBeNull()
    expect(result?.content_type).toBe('Note')
    expect(result?.content.title).toBe('Testing 2')
    expect(result?.content.text).toBe('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
  })
})
