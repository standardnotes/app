/**
 * @jest-environment jsdom
 */

import { jsonTestData, htmlTestData } from './testData'
import { GoogleKeepConverter } from './GoogleKeepConverter'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/snjs'

describe('GoogleKeepConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const superConverterService: SuperConverterServiceInterface = {
    isValidSuperString: (data: string) => true,
    convertOtherFormatToSuperString: (data: string, format: string) => data,
    convertSuperStringToOtherFormat: (data: string, format: string) => data,
  }
  const generateUuid = new GenerateUuid(crypto)

  it('should parse json data', () => {
    const converter = new GoogleKeepConverter(superConverterService, generateUuid)

    const result = converter.tryParseAsJson(jsonTestData)

    expect(result).not.toBeNull()
    expect(result?.created_at).toBeInstanceOf(Date)
    expect(result?.updated_at).toBeInstanceOf(Date)
    expect(result?.uuid).not.toBeNull()
    expect(result?.content_type).toBe('Note')
    expect(result?.content.title).toBe('Testing 1')
    expect(result?.content.text).toBe('This is a test.')
    expect(result?.content.trashed).toBe(false)
    expect(result?.content.archived).toBe(false)
    expect(result?.content.pinned).toBe(false)
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
