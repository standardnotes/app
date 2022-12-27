import { ContentType } from '@standardnotes/common'
import { WebApplicationInterface } from '@standardnotes/services'
import { DecryptedTransferPayload, NoteContent, TagContent } from '@standardnotes/models'
import { EvernoteConverter } from './EvernoteConverter'
import data from './testData'

describe('EvernoteConverter', () => {
  let application: WebApplicationInterface

  beforeEach(() => {
    application = {
      generateUUID: jest.fn().mockReturnValue(Math.random()),
    } as any as WebApplicationInterface
  })

  it('should parse and strip html', () => {
    const converter = new EvernoteConverter(application)

    const result = converter.parseENEXData(data, true)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('This is a test.')
    expect(result?.[1].content_type).toBe(ContentType.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    )
    expect(result?.[2].content_type).toBe(ContentType.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('evernote')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0]).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1]).toBe(result?.[1].uuid)
  })

  it('should parse and not strip html', () => {
    const converter = new EvernoteConverter(application)

    const result = converter.parseENEXData(data, false)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(3)
    expect(result?.[0].content_type).toBe(ContentType.Note)
    expect((result?.[0] as DecryptedTransferPayload<NoteContent>).content.text).toBe('<div>This is a test.</div>')
    expect(result?.[1].content_type).toBe(ContentType.Note)
    expect((result?.[1] as DecryptedTransferPayload<NoteContent>).content.text).toBe(
      '<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</div>',
    )
    expect(result?.[2].content_type).toBe(ContentType.Tag)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.title).toBe('evernote')
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references.length).toBe(2)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[0]).toBe(result?.[0].uuid)
    expect((result?.[2] as DecryptedTransferPayload<TagContent>).content.references[1]).toBe(result?.[1].uuid)
  })
})
