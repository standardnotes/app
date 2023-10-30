/**
 * @jest-environment jsdom
 */

import { jsonTextContentData, htmlTestData, jsonListContentData } from './testData'
import { GoogleKeepConverter } from './GoogleKeepConverter'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/snjs'

describe('GoogleKeepConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const superConverterService: SuperConverterServiceInterface = {
    isValidSuperString: () => true,
    convertOtherFormatToSuperString: (data: string) => data,
    convertSuperStringToOtherFormat: async (data: string) => data,
    getEmbeddedFileIDsFromSuperString: () => [],
  }
  const generateUuid = new GenerateUuid(crypto)

  it('should parse json data', () => {
    const converter = new GoogleKeepConverter(superConverterService, generateUuid)

    const textContent = converter.tryParseAsJson(jsonTextContentData, false)

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

    const listContent = converter.tryParseAsJson(jsonListContentData, false)

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

  it('should parse html data', () => {
    const converter = new GoogleKeepConverter(superConverterService, generateUuid)

    const result = converter.tryParseAsHtml(
      htmlTestData,
      {
        name: 'note-2.html',
      },
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
