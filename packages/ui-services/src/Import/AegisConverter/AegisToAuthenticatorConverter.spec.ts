import { AegisToAuthenticatorConverter } from './AegisToAuthenticatorConverter'
import data from './testData'

describe('AegisConverter', () => {
  it('should parse entries', () => {
    const converter = new AegisToAuthenticatorConverter()

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
})
