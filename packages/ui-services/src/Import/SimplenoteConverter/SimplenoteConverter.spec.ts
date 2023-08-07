import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SimplenoteConverter } from './SimplenoteConverter'
import data from './testData'
import { GenerateUuid } from '@standardnotes/services'

describe('SimplenoteConverter', () => {
  const crypto = {
    generateUUID: () => String(Math.random()),
  } as unknown as PureCryptoInterface

  const generateUuid = new GenerateUuid(crypto)

  it('should parse', () => {
    const converter = new SimplenoteConverter(generateUuid)

    const result = converter.parse(data)

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
    expect(result?.[1].content.text).toBe("This is the 2nd note's content.")
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
