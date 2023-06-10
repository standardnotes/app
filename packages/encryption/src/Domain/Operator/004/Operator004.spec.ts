import { ContentType, ProtocolVersion } from '@standardnotes/common'
import { DecryptedPayload, ItemContent, ItemsKeyContent, PayloadTimestampDefaults } from '@standardnotes/models'
import { SNItemsKey } from '../../Keys/ItemsKey/ItemsKey'
import { SNProtocolOperator004 } from './Operator004'
import { getMockedCrypto } from './MockedCrypto'

describe('operator 004', () => {
  const crypto = getMockedCrypto()

  let operator: SNProtocolOperator004

  beforeEach(() => {
    operator = new SNProtocolOperator004(crypto)
  })

  it('should deconstructEncryptedPayloadString', () => {
    // const string = '004:noncy:<e>foo<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9'

    // const result = operator.deconstructEncryptedPayloadString(string)

    // expect(result).toEqual({
    //   version: '004',
    //   nonce: 'noncy',
    //   ciphertext: '<e>foo<e>',
    //   authenticatedData: 'eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
    // })
  })

  it('should generateEncryptedParameters', () => {
    const payload = {
      uuid: '123',
      content_type: ContentType.Note,
      content: { foo: 'bar' } as unknown as jest.Mocked<ItemContent>,
      ...PayloadTimestampDefaults(),
    } as jest.Mocked<DecryptedPayload>

    const key = new SNItemsKey(
      new DecryptedPayload<ItemsKeyContent>({
        uuid: 'key-456',
        content_type: ContentType.ItemsKey,
        content: {
          itemsKey: 'secret',
          version: ProtocolVersion.V004,
        } as jest.Mocked<ItemsKeyContent>,
        ...PayloadTimestampDefaults(),
      }),
    )

    const result = operator.generateEncryptedParameters(payload, key)

    expect(result).toEqual({
      uuid: '123',
      items_key_id: 'key-456',
      content: '004:random-string:<e>{"foo":"bar"}<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
      enc_item_key: '004:random-string:<e>random-string<e>:eyJ1IjoiMTIzIiwidiI6IjAwNCJ9',
      version: '004',
    })
  })
})
