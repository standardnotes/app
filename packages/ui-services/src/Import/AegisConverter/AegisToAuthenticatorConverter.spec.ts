import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'
import { AegisToAuthenticatorConverter } from './AegisToAuthenticatorConverter'
import data from './testData'
import { GenerateUuid } from '@standardnotes/services'

describe('AegisConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const generateUuid = new GenerateUuid(crypto)

  it('should parse entries', () => {
    const converter = new AegisToAuthenticatorConverter(generateUuid)

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

  it('should create note from entries with editor info', () => {
    const converter = new AegisToAuthenticatorConverter(generateUuid)

    const parsedEntries = converter.parseEntries(data)

    const result = converter.createNoteFromEntries(
      parsedEntries!,
      {
        lastModified: 123456789,
        name: 'test.json',
      },
      true,
    )

    expect(result).not.toBeNull()
    expect(result.content_type).toBe('Note')
    expect(result.created_at).toBeInstanceOf(Date)
    expect(result.updated_at).toBeInstanceOf(Date)
    expect(result.uuid).not.toBeNull()
    expect(result.content.title).toBe('test')
    expect(result.content.text).toBe(
      '[{"service":"TestMail","account":"test@test.com","secret":"TESTMAILTESTMAILTESTMAILTESTMAIL","notes":"Some note"},{"service":"Some Service","account":"test@test.com","secret":"SOMESERVICESOMESERVICESOMESERVIC","notes":"Some other service"}]',
    )
    expect(result.content.noteType).toBe(NoteType.Authentication)
    expect(result.content.editorIdentifier).toBe(NativeFeatureIdentifier.TYPES.TokenVaultEditor)
  })

  it('should create note from entries without editor info', () => {
    const converter = new AegisToAuthenticatorConverter(generateUuid)

    const parsedEntries = converter.parseEntries(data)

    const result = converter.createNoteFromEntries(
      parsedEntries!,
      {
        lastModified: 123456789,
        name: 'test.json',
      },
      false,
    )

    expect(result).not.toBeNull()
    expect(result.content_type).toBe('Note')
    expect(result.created_at).toBeInstanceOf(Date)
    expect(result.updated_at).toBeInstanceOf(Date)
    expect(result.uuid).not.toBeNull()
    expect(result.content.title).toBe('test')
    expect(result.content.text).toBe(
      '[{"service":"TestMail","account":"test@test.com","secret":"TESTMAILTESTMAILTESTMAILTESTMAIL","notes":"Some note"},{"service":"Some Service","account":"test@test.com","secret":"SOMESERVICESOMESERVICESOMESERVIC","notes":"Some other service"}]',
    )
    expect(result.content.noteType).toBeFalsy()
    expect(result.content.editorIdentifier).toBeFalsy()
  })
})
