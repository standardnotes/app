import { WebApplicationInterface } from '@standardnotes/services'
import { AegisToAuthenticatorConverter } from './AegisToAuthenticatorConverter'
import data from './testData'

describe('AegisConverter', () => {
  let application: WebApplicationInterface

  beforeEach(() => {
    application = {
      generateUUID: jest.fn().mockReturnValue('test'),
    } as unknown as WebApplicationInterface
  })

  it('should parse entries', () => {
    const converter = new AegisToAuthenticatorConverter(application)

    const result = converter.parseEntries(data)

    expect(result).not.toBeNull()
    expect(result?.length).toBe(2)
    expect(result?.[0]).toStrictEqual({
      service: 'TestMail',
      account: 'test@test.com',
      secret: 'TESTMAILTESTMAILTESTMAILTESTMAIL',
      notes: 'Some note',
    })
    expect(result?.[1]).toStrictEqual({
      service: 'Some Service',
      account: 'test@test.com',
      secret: 'SOMESERVICESOMESERVICESOMESERVIC',
      notes: 'Some other service',
    })
  })

  it('should create note from entries', () => {
    const converter = new AegisToAuthenticatorConverter(application)

    const parsedEntries = converter.parseEntries(data)

    const result = converter.createNoteFromEntries(parsedEntries!, {
      lastModified: 123456789,
      name: 'test.json',
    })

    expect(result).not.toBeNull()
    expect(result.content_type).toBe('Note')
    expect(result.created_at).toBeInstanceOf(Date)
    expect(result.updated_at).toBeInstanceOf(Date)
    expect(result.uuid).not.toBeNull()
    expect(result.content.title).toBe('test')
    expect(result.content.text).toBe(
      '[{"service":"TestMail","account":"test@test.com","secret":"TESTMAILTESTMAILTESTMAILTESTMAIL","notes":"Some note"},{"service":"Some Service","account":"test@test.com","secret":"SOMESERVICESOMESERVICESOMESERVIC","notes":"Some other service"}]',
    )
  })
})
