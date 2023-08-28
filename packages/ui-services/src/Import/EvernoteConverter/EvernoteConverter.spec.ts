/**
 * @jest-environment jsdom
 */

import { ContentType } from '@standardnotes/domain-core'
import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import { EvernoteConverter } from './EvernoteConverter'
import data from './testData'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { GenerateUuid } from '@standardnotes/services'
import { SuperConverterServiceInterface } from '@standardnotes/files'

// Mock dayjs so dayjs.extend() doesn't throw an error in EvernoteConverter.ts
jest.mock('dayjs', () => {
  return {
    __esModule: true,
    default: {
      extend: jest.fn(),
      utc: jest.fn().mockReturnValue({
        toDate: jest.fn().mockReturnValue(new Date()),
      }),
    },
  }
})

describe('EvernoteConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const superConverterService: SuperConverterServiceInterface = {
    isValidSuperString: () => true,
    convertOtherFormatToSuperString: (data: string) => data,
    convertSuperStringToOtherFormat: (data: string) => data,
  }

  const generateUuid = new GenerateUuid(crypto)

  it('should parse and strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(data, true)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('This is a test.')
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    )
    expect(result?.[2].content_type).toBe(ContentType.TYPES.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('evernote')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0].uuid).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1].uuid).toBe(result?.[1].uuid)
  })

  it('should parse and not strip html', () => {
    const converter = new EvernoteConverter(superConverterService, generateUuid)

    const result = converter.parseENEXData(data, false)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('<div>This is a test.</div>')
    expect(result?.[1].content_type).toBe(ContentType.TYPES.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>',
    )
    expect(result?.[2].content_type).toBe(ContentType.TYPES.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('evernote')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0].uuid).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1].uuid).toBe(result?.[1].uuid)
  })
})
