/**
 * @jest-environment jsdom
 */

import { WebApplicationInterface } from '@standardnotes/snjs'
import { jsonTestData, htmlTestData } from './testData'
import { GoogleKeepConverter } from './GoogleKeepConverter'

describe('GoogleKeepConverter', () => {
  let application: WebApplicationInterface

  beforeEach(() => {
    application = {
      generateUUID: jest.fn().mockReturnValue('uuid'),
    } as unknown as WebApplicationInterface
  })

  it('should parse json data', () => {
    const converter = new GoogleKeepConverter(application)

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
    const converter = new GoogleKeepConverter(application)

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
